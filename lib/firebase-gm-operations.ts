import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import staticGMData from "@/data/gm-data.json"

export interface GM {
  id?: string
  kodi: string | number // Kod - Product code
  tovar?: string // Tovar - Product name (alternative to nomi)
  nomi?: string // Nomi - Product name (keeping for backward compatibility)
  olchBirligi?: string // O'lch. birligi - Unit of measurement (KOMP, DONA, KG, etc.)
  narxi: string | number // Narx - Price
  model?: string // Optional - Model
  kompaniya?: string // Optional - Company
  sold?: number
  stock?: number
  minStock?: number
  maxStock?: number
  location?: string
  category?: string
  supplier?: string
  cost?: string | number
  profit?: number
  barcode?: string
  weight?: number
  dimensions?: string
  description?: string
  status?: "active" | "inactive" | "discontinued"
  lastSold?: Timestamp
  lastRestocked?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
  isDeleted?: boolean
  isStatic?: boolean
}

const COLLECTION_NAME = "GMs"

const loadStaticGMs = async (): Promise<GM[]> => {
  try {
    const staticData = staticGMData

    return staticData.map((item: any, index: number) => ({
      id: item.id || `gm-static-${index + 1}`,
      kodi: item.kodi || item.KODI || item.Kod,
      tovar: item.tovar || item.Tovar,
      nomi: item.nomi || item.NOMI || item.tovar || item.Tovar,
      olchBirligi: item.olchBirligi || item["O'lch. birligi"] || item.unit,
      model: item.model || item.MODEL || "",
      kompaniya: item.kompaniya || item.KOMPANIYA || "",
      narxi:
        typeof item.narxi === "number"
          ? item.narxi.toString()
          : item.narxi || item.NARXI || item.Narx?.toString() || "0",
      sold: item.sold || 0,
      stock: item.stock || 0,
      minStock: item.minStock || 10,
      maxStock: item.maxStock || 1000,
      location: item.location,
      category: item.category,
      supplier: item.supplier,
      cost: item.cost,
      barcode: item.barcode,
      weight: item.weight,
      dimensions: item.dimensions,
      description: item.description,
      status: item.status || "active",
      isStatic: true,
    }))
  } catch (error) {
    console.error("Error loading static GMs:", error)
    return []
  }
}

export const getGMs = async (): Promise<GM[]> => {
  try {
    // Load static GMs
    const staticGMs = await loadStaticGMs()

    // Load Firebase GMs
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const firebaseGMs = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as GM,
    )

    const firebaseMap = new Map<string, GM>()
    const deletedStaticIds = new Set<string>()

    // Process Firebase GMs
    firebaseGMs.forEach((p) => {
      if (p.isStatic) {
        // For static GMs in Firebase
        if (p.isDeleted) {
          // Mark this static ID as deleted
          deletedStaticIds.add(p.id || "")
        } else {
          // This is a modified static GM, use Firebase version
          firebaseMap.set(p.id || "", p)
        }
      } else if (!p.isDeleted) {
        // Regular Firebase GM (not deleted)
        firebaseMap.set(p.id || "", p)
      }
    })

    // Filter static GMs: exclude deleted ones and ones that exist in Firebase
    const activeStaticGMs = staticGMs.filter((p) => !deletedStaticIds.has(p.id || "") && !firebaseMap.has(p.id || ""))

    // Merge: Firebase GMs first (including modified static ones), then unmodified static
    return [...Array.from(firebaseMap.values()), ...activeStaticGMs]
  } catch (error) {
    console.error("Error getting GMs:", error)
    throw error
  }
}

// Add new GM
export const addGM = async (GM: Omit<GM, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...GM,
      nomi: GM.nomi || GM.tovar || "",
      sold: GM.sold || 0,
      stock: GM.stock || 0,
      minStock: GM.minStock || 10,
      maxStock: GM.maxStock || 1000,
      status: GM.status || "active",
      isDeleted: false,
      isStatic: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding GM:", error)
    throw error
  }
}

export const updateGM = async (id: string, updates: Partial<GM>): Promise<void> => {
  try {
    // Check if this is a static GM
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)

    if (GM?.isStatic) {
      // For static GMs, check if Firebase entry already exists
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseGM = querySnapshot.docs.find(
        (doc) => doc.data().id === id && doc.data().isStatic && !doc.data().isDeleted,
      )

      if (existingFirebaseGM) {
        // Update existing Firebase entry
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        })
      } else {
        // Create new Firebase entry with updated data
        await addDoc(collection(db, COLLECTION_NAME), {
          ...GM,
          ...updates,
          id: id, // Keep original static ID
          isStatic: true,
          isDeleted: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    } else {
      // Regular Firebase GM
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error("Error updating GM:", error)
    throw error
  }
}

export const deleteGM = async (id: string): Promise<void> => {
  try {
    // Check if this is a static GM
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)

    if (GM?.isStatic) {
      // Check if Firebase entry already exists
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

      if (existingFirebaseGM) {
        // Update existing Firebase entry to mark as deleted
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
        await updateDoc(docRef, {
          isDeleted: true,
          deletedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      } else {
        // Create new Firebase entry marking it as deleted
        await addDoc(collection(db, COLLECTION_NAME), {
          id: id, // Keep the original static ID
          isDeleted: true,
          isStatic: true,
          deletedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    } else {
      // For Firebase GMs, mark as deleted
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error("Error deleting GM:", error)
    throw error
  }
}

// Sell GM (increment sold count)
export const sellGM = async (id: string, quantity: number): Promise<void> => {
  try {
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)
    if (GM) {
      if (GM.isStatic) {
        // Check if this static GM already has a Firebase entry
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseGM) {
          // Update existing Firebase entry
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
          const data = existingFirebaseGM.data()
          const newStock = Math.max(0, (data.stock || 0) - quantity)
          await updateDoc(docRef, {
            sold: (data.sold || 0) + quantity,
            stock: newStock,
            lastSold: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        } else {
          // Create new Firebase entry for static GM
          await addDoc(collection(db, COLLECTION_NAME), {
            ...GM,
            id: id, // Keep original static ID
            sold: quantity,
            stock: Math.max(0, (GM.stock || 0) - quantity),
            isStatic: true,
            isDeleted: false,
            lastSold: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } else {
        // Regular Firebase GM
        const docRef = doc(db, COLLECTION_NAME, id)
        const newStock = Math.max(0, (GM.stock || 0) - quantity)
        await updateDoc(docRef, {
          sold: (GM.sold || 0) + quantity,
          stock: newStock,
          lastSold: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    }
  } catch (error) {
    console.error("Error selling GM:", error)
    throw error
  }
}

export const deleteAllGMs = async (): Promise<void> => {
  try {
    const q = query(collection(db, COLLECTION_NAME))
    const querySnapshot = await getDocs(q)

    // Mark all documents as deleted
    const deletePromises = querySnapshot.docs.map((docSnapshot) => {
      return updateDoc(docSnapshot.ref, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })
    await Promise.all(deletePromises)

    // Also mark all static GMs as deleted
    const staticGMs = await loadStaticGMs()
    const staticDeletePromises = staticGMs.map((GM) => {
      return addDoc(collection(db, COLLECTION_NAME), {
        id: GM.id,
        isDeleted: true,
        isStatic: true,
        deletedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })
    await Promise.all(staticDeletePromises)
  } catch (error) {
    console.error("Error deleting all GMs:", error)
    throw error
  }
}

export const addStock = async (id: string, quantity: number): Promise<void> => {
  try {
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)
    if (GM) {
      if (GM.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseGM) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
          const data = existingFirebaseGM.data()
          await updateDoc(docRef, {
            stock: (data.stock || 0) + quantity,
            lastRestocked: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        } else {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...GM,
            id: id,
            stock: (GM.stock || 0) + quantity,
            isStatic: true,
            isDeleted: false,
            lastRestocked: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } else {
        const docRef = doc(db, COLLECTION_NAME, id)
        await updateDoc(docRef, {
          stock: (GM.stock || 0) + quantity,
          lastRestocked: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    }
  } catch (error) {
    console.error("Error adding stock:", error)
    throw error
  }
}

export const removeStock = async (id: string, quantity: number): Promise<void> => {
  try {
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)
    if (GM) {
      const newStock = Math.max(0, (GM.stock || 0) - quantity)

      if (GM.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseGM) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
          await updateDoc(docRef, {
            stock: newStock,
            updatedAt: Timestamp.now(),
          })
        } else {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...GM,
            id: id,
            stock: newStock,
            isStatic: true,
            isDeleted: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } else {
        const docRef = doc(db, COLLECTION_NAME, id)
        await updateDoc(docRef, {
          stock: newStock,
          updatedAt: Timestamp.now(),
        })
      }
    }
  } catch (error) {
    console.error("Error removing stock:", error)
    throw error
  }
}

export const bulkUpdateStock = async (updates: { id: string; stock: number }[]): Promise<void> => {
  try {
    const GMs = await getGMs()
    const updatePromises = updates.map(async ({ id, stock }) => {
      const GM = GMs.find((p) => p.id === id)

      if (GM?.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseGM) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
          return updateDoc(docRef, {
            stock,
            updatedAt: Timestamp.now(),
          })
        } else {
          return addDoc(collection(db, COLLECTION_NAME), {
            ...GM,
            id: id,
            stock,
            isStatic: true,
            isDeleted: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } else {
        const docRef = doc(db, COLLECTION_NAME, id)
        return updateDoc(docRef, {
          stock,
          updatedAt: Timestamp.now(),
        })
      }
    })
    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error bulk updating stock:", error)
    throw error
  }
}

export const getLowStockGMs = async (): Promise<GM[]> => {
  try {
    const GMs = await getGMs()
    return GMs.filter((GM) => (GM.stock || 0) <= (GM.minStock || 10))
  } catch (error) {
    console.error("Error getting low stock GMs:", error)
    throw error
  }
}

export const getGMsByCategory = async (category: string): Promise<GM[]> => {
  try {
    const GMs = await getGMs()
    return GMs.filter((GM) => GM.category === category)
  } catch (error) {
    console.error("Error getting GMs by category:", error)
    throw error
  }
}

export const getInventoryValue = async (): Promise<number> => {
  try {
    const GMs = await getGMs()
    return GMs.reduce((total, GM) => {
      const price = Number.parseFloat(GM.narxi.toString().replace(/[^\d.]/g, "")) || 0
      const stock = GM.stock || 0
      return total + price * stock
    }, 0)
  } catch (error) {
    console.error("Error calculating inventory value:", error)
    throw error
  }
}
