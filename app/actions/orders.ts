"use server"

import { revalidatePath } from "next/cache"
import { createPocketBase } from "@/lib/pocketbase"
import { getAuthenticatedUser } from "@/lib/auth"

export async function createOrderAction(data: {
  nama_customer: string
  customer_phone: string
  jenis_joki: string
  detail_joki: string
  deadline: string
  catatan: string
  base_harga: number
  jumlah: number
  total_harga: number
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const pb = createPocketBase()

  try {
    const record = await pb.collection("orders").create({
      ...data,
      worker: "", // Start unassigned
    })

    revalidatePath("/dashboard/pesanan")
    return { success: true, record }
  } catch (error: any) {
    console.error("Failed to create order:", error)
    throw new Error(error.response?.message || "Failed to create order")
  }
}

export async function claimOrderAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) throw new Error("Unauthorized")

  const pb = createPocketBase()
  
  try {
    await pb.collection("orders").update(orderId, {
      worker: user.email
    })
    revalidatePath("/dashboard/pesanan")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to claim order:", error)
    throw new Error(error.response?.message || "Failed to claim order")
  }
}

export async function completeOrderAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) throw new Error("Unauthorized")

  const pb = createPocketBase()
  
  try {
    // 1. Fetch current order
    const order = await pb.collection("orders").getOne(orderId)
    
    // 2. We should ideally pull Chat History here using an internal API call or database access.
    // However, WhatsApp backend fetching depends on active Chrome process runtime.
    // For now, we move the order metadata to the "tickets" structure and delete from `orders`.
    
    // Avoid PocketBase internal id collisions and collection mapping
    const { collectionId, collectionName, id, created, updated, ...rest } = order;
    
    // We expect a Collection named `history_tickets` with matching schema + `chat_history`.
    const ticketRecord = {
      ...rest,
      status: "done",
      chat_history: "Chat exported and archived upon completion.", // Placeholder until native integration
      completed_by: user.email,
    };
    
    await pb.collection("history_tickets").create(ticketRecord)
    
    // 3. Delete from active queue
    await pb.collection("orders").delete(orderId)

    revalidatePath("/dashboard/pesanan")
    revalidatePath("/dashboard/history")
    
    return { success: true }
  } catch (error: any) {
    console.error("Failed to complete order:", error)
    throw new Error(error.response?.message || "Failed to complete order")
  }
}
