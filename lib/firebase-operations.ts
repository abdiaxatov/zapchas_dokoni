import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import staticProductsData from "@/data/static-products.json"

export interface Product {
  id?: string
  kodi: string
  model: string
  nomi: string
  kompaniya: string
  narxi: string
  sold?: number
  stock?: number // Current stock quantity
  minStock?: number // Minimum stock alert level
  maxStock?: number // Maximum stock capacity
  location?: string // Warehouse location
  category?: string // Product category
  supplier?: string // Supplier information
  cost?: string // Cost price
  profit?: number // Profit margin
  barcode?: string // Barcode
  weight?: number // Weight in kg
  dimensions?: string // Dimensions (LxWxH)
  description?: string // Product description
  status?: "active" | "inactive" | "discontinued" // Product status
  lastSold?: Timestamp // Last sale date
  lastRestocked?: Timestamp // Last restock date
  createdAt?: Timestamp
  updatedAt?: Timestamp
  isDeleted?: boolean // Soft delete flag
  isStatic?: boolean // Flag to identify static data
}

const COLLECTION_NAME = "products"

const loadStaticProducts = async (): Promise<Product[]> => {
  try {
    const staticData = staticProductsData

    // Transform static data to match Product interface
    return staticData.map((item: any, index: number) => ({
      id: item.id || `static-${index + 1}`, // Use existing ID or generate one
      kodi: item.kodi || item.KODI,
      model: item.model || item.MODEL || "",
      nomi: item.nomi || item.NOMI,
      kompaniya: item.kompaniya || item.KOMPANIYA,
      narxi: typeof item.narxi === "number" ? item.narxi.toString() : item.narxi || item.NARXI,
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
    console.error("Error loading static products:", error)
    return []
  }
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Load static products
    const staticProducts = await loadStaticProducts()

    // Load Firebase products
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const firebaseProducts = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    )

    const firebaseMap = new Map<string, Product>()
    const deletedStaticIds = new Set<string>()

    // Process Firebase products
    firebaseProducts.forEach((p) => {
      if (p.isStatic) {
        // For static products in Firebase
        if (p.isDeleted) {
          // Mark this static ID as deleted
          deletedStaticIds.add(p.id || "")
        } else {
          // This is a modified static product, use Firebase version
          firebaseMap.set(p.id || "", p)
        }
      } else if (!p.isDeleted) {
        // Regular Firebase product (not deleted)
        firebaseMap.set(p.id || "", p)
      }
    })

    // Filter static products: exclude deleted ones and ones that exist in Firebase
    const activeStaticProducts = staticProducts.filter(
      (p) => !deletedStaticIds.has(p.id || "") && !firebaseMap.has(p.id || ""),
    )

    // Merge: Firebase products first (including modified static ones), then unmodified static
    return [...Array.from(firebaseMap.values()), ...activeStaticProducts]
  } catch (error) {
    console.error("Error getting products:", error)
    throw error
  }
}

// Add new product
export const addProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...product,
      sold: product.sold || 0,
      stock: product.stock || 0,
      minStock: product.minStock || 10,
      maxStock: product.maxStock || 1000,
      status: product.status || "active",
      isDeleted: false, // Initialize isDeleted flag
      isStatic: false, // Mark as non-static
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  try {
    // Check if this is a static product
    const products = await getProducts()
    const product = products.find((p) => p.id === id)

    if (product?.isStatic) {
      // For static products, check if Firebase entry already exists
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseProduct = querySnapshot.docs.find(
        (doc) => doc.data().id === id && doc.data().isStatic && !doc.data().isDeleted,
      )

      if (existingFirebaseProduct) {
        // Update existing Firebase entry
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        })
      } else {
        // Create new Firebase entry with updated data
        await addDoc(collection(db, COLLECTION_NAME), {
          ...product,
          ...updates,
          id: id, // Keep original static ID
          isStatic: true,
          isDeleted: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    } else {
      // Regular Firebase product
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // Check if this is a static product
    const products = await getProducts()
    const product = products.find((p) => p.id === id)

    if (product?.isStatic) {
      // Check if Firebase entry already exists
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseProduct = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

      if (existingFirebaseProduct) {
        // Update existing Firebase entry to mark as deleted
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
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
      // For Firebase products, mark as deleted
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Sell product (increment sold count)
export const sellProduct = async (id: string, quantity: number): Promise<void> => {
  try {
    const products = await getProducts()
    const product = products.find((p) => p.id === id)
    if (product) {
      if (product.isStatic) {
        // Check if this static product already has a Firebase entry
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseProduct = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseProduct) {
          // Update existing Firebase entry
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
          const data = existingFirebaseProduct.data()
          const newStock = Math.max(0, (data.stock || 0) - quantity)
          await updateDoc(docRef, {
            sold: (data.sold || 0) + quantity,
            stock: newStock,
            lastSold: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        } else {
          // Create new Firebase entry for static product
          await addDoc(collection(db, COLLECTION_NAME), {
            ...product,
            id: id, // Keep original static ID
            sold: quantity,
            stock: Math.max(0, (product.stock || 0) - quantity),
            isStatic: true,
            isDeleted: false,
            lastSold: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } else {
        // Regular Firebase product
        const docRef = doc(db, COLLECTION_NAME, id)
        const newStock = Math.max(0, (product.stock || 0) - quantity)
        await updateDoc(docRef, {
          sold: (product.sold || 0) + quantity,
          stock: newStock,
          lastSold: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    }
  } catch (error) {
    console.error("Error selling product:", error)
    throw error
  }
}

export const deleteAllProducts = async (): Promise<void> => {
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

    // Also mark all static products as deleted
    const staticProducts = await loadStaticProducts()
    const staticDeletePromises = staticProducts.map((product) => {
      return addDoc(collection(db, COLLECTION_NAME), {
        id: product.id,
        isDeleted: true,
        isStatic: true,
        deletedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })
    await Promise.all(staticDeletePromises)
  } catch (error) {
    console.error("Error deleting all products:", error)
    throw error
  }
}

export const addStock = async (id: string, quantity: number): Promise<void> => {
  try {
    const products = await getProducts()
    const product = products.find((p) => p.id === id)
    if (product) {
      if (product.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseProduct = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseProduct) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
          const data = existingFirebaseProduct.data()
          await updateDoc(docRef, {
            stock: (data.stock || 0) + quantity,
            lastRestocked: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        } else {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...product,
            id: id,
            stock: (product.stock || 0) + quantity,
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
          stock: (product.stock || 0) + quantity,
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
    const products = await getProducts()
    const product = products.find((p) => p.id === id)
    if (product) {
      const newStock = Math.max(0, (product.stock || 0) - quantity)

      if (product.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseProduct = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseProduct) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
          await updateDoc(docRef, {
            stock: newStock,
            updatedAt: Timestamp.now(),
          })
        } else {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...product,
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
    const products = await getProducts()
    const updatePromises = updates.map(async ({ id, stock }) => {
      const product = products.find((p) => p.id === id)

      if (product?.isStatic) {
        const q = query(collection(db, COLLECTION_NAME))
        const querySnapshot = await getDocs(q)
        const existingFirebaseProduct = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

        if (existingFirebaseProduct) {
          const docRef = doc(db, COLLECTION_NAME, existingFirebaseProduct.id)
          return updateDoc(docRef, {
            stock,
            updatedAt: Timestamp.now(),
          })
        } else {
          return addDoc(collection(db, COLLECTION_NAME), {
            ...product,
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

export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    const products = await getProducts()
    return products.filter((product) => (product.stock || 0) <= (product.minStock || 10))
  } catch (error) {
    console.error("Error getting low stock products:", error)
    throw error
  }
}

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const products = await getProducts()
    return products.filter((product) => product.category === category)
  } catch (error) {
    console.error("Error getting products by category:", error)
    throw error
  }
}

export const getInventoryValue = async (): Promise<number> => {
  try {
    const products = await getProducts()
    return products.reduce((total, product) => {
      const price = Number.parseFloat(product.narxi.replace(/[^\d.]/g, "")) || 0
      const stock = product.stock || 0
      return total + price * stock
    }, 0)
  } catch (error) {
    console.error("Error calculating inventory value:", error)
    throw error
  }
}
