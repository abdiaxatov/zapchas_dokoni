import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import staticGMsData from "@/data/gm-data.json"

export interface GM {
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
  category?: string // GM category
  supplier?: string // Supplier information
  cost?: string // Cost price
  profit?: number // Profit margin
  barcode?: string // Barcode
  weight?: number // Weight in kg
  dimensions?: string // Dimensions (LxWxH)
  description?: string // GM description
  status?: "active" | "inactive" | "discontinued" // GM status
  lastSold?: Timestamp // Last sale date
  paymentType?: "naqd" | "qarz"
  lastRestocked?: Timestamp // Last restock date
  createdAt?: Timestamp
  updatedAt?: Timestamp
  isDeleted?: boolean // Soft delete flag
  isStatic?: boolean // Flag to identify static data
}

export interface SaleGM {
  id?: string
  items: Array<{
    GMId: string
    GMName: string
    GMCode: string
    company: string
    quantity: number
    price: number
    total: number
  }>
  totalAmount: number
  receiptNumber: string
  saleDate: Timestamp
  createdAt?: Timestamp
  isLoan?: boolean // Whether this is a loan transaction
  loanStatus?: "pending" | "partial" | "paid" // Loan payment status
  amountPaid?: number // Amount paid so far
  amountRemaining?: number // Amount still owed
}

export interface LoanRecord {
  id?: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  transactionId: string // Reference to SaleGM
  receiptNumber: string
  totalAmount: number
  amountPaid: number
  amountRemaining: number
  loanDate: Timestamp
  dueDate?: Timestamp
  status: "pending" | "partial" | "paid"
  paymentHistory: Array<{
    amount: number
    date: Timestamp
    note?: string
  }>
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key]
    }
  }
  return cleaned
}

const COLLECTION_NAME = "GMs"
const SALES_COLLECTION_NAME = "SaleGMs"
const LOANS_COLLECTION_NAME = "loans"

const loadStaticGMs = async (): Promise<GM[]> => {
  try {
    const staticData = staticGMsData

    // Transform static data to match GM interface
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
      paymentType: item.paymentType || "naqd",
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
    const activeStaticGMs = staticGMs.filter(
      (p) => !deletedStaticIds.has(p.id || "") && !firebaseMap.has(p.id || ""),
    )

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
    const cleanedGM = removeUndefinedFields({
      ...GM,
      sold: GM.sold || 0,
      stock: GM.stock || 0,
      minStock: GM.minStock || 10,
      maxStock: GM.maxStock || 1000,
      status: GM.status || "active",
      paymentType: GM.paymentType || "naqd",
      isDeleted: false,
      isStatic: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanedGM)
    return docRef.id
  } catch (error) {
    console.error("Error adding GM:", error)
    throw error
  }
}

export const updateGM = async (id: string, updates: Partial<GM>): Promise<void> => {
  try {
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)

    if (GM?.isStatic) {
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseGM = querySnapshot.docs.find(
        (doc) => doc.data().id === id && doc.data().isStatic && !doc.data().isDeleted,
      )

      if (existingFirebaseGM) {
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
        const cleanedUpdates = removeUndefinedFields({
          ...updates,
          updatedAt: Timestamp.now(),
        })
        await updateDoc(docRef, cleanedUpdates)
      } else {
        const cleanedGM = removeUndefinedFields({
          ...GM,
          ...updates,
          id: id,
          isStatic: true,
          isDeleted: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        await addDoc(collection(db, COLLECTION_NAME), cleanedGM)
      }
    } else {
      const docRef = doc(db, COLLECTION_NAME, id)
      const cleanedUpdates = removeUndefinedFields({
        ...updates,
        updatedAt: Timestamp.now(),
      })
      await updateDoc(docRef, cleanedUpdates)
    }
  } catch (error) {
    console.error("Error updating GM:", error)
    throw error
  }
}

export const deleteGM = async (id: string): Promise<void> => {
  try {
    const GMs = await getGMs()
    const GM = GMs.find((p) => p.id === id)

    if (GM?.isStatic) {
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const existingFirebaseGM = querySnapshot.docs.find((doc) => doc.data().id === id && doc.data().isStatic)

      if (existingFirebaseGM) {
        const docRef = doc(db, COLLECTION_NAME, existingFirebaseGM.id)
        await updateDoc(docRef, {
          isDeleted: true,
          deletedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          id: id,
          isDeleted: true,
          isStatic: true,
          deletedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
    } else {
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

export const sellGM = async (id: string, quantity: number): Promise<void> => {
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
          const newStock = Math.max(0, (data.stock || 0) - quantity)
          await updateDoc(docRef, {
            sold: (data.sold || 0) + quantity,
            stock: newStock,
            lastSold: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        } else {
          const cleanedGM = removeUndefinedFields({
            ...GM,
            id: id,
            sold: quantity,
            stock: Math.max(0, (GM.stock || 0) - quantity),
            isStatic: true,
            isDeleted: false,
            lastSold: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          await addDoc(collection(db, COLLECTION_NAME), cleanedGM)
        }
      } else {
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
          const cleanedGM = removeUndefinedFields({
            ...GM,
            id: id,
            stock: (GM.stock || 0) + quantity,
            isStatic: true,
            isDeleted: false,
            lastRestocked: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          await addDoc(collection(db, COLLECTION_NAME), cleanedGM)
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
          const cleanedGM = removeUndefinedFields({
            ...GM,
            id: id,
            stock: newStock,
            isStatic: true,
            isDeleted: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          await addDoc(collection(db, COLLECTION_NAME), cleanedGM)
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
          const cleanedGM = removeUndefinedFields({
            ...GM,
            id: id,
            stock,
            isStatic: true,
            isDeleted: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          return addDoc(collection(db, COLLECTION_NAME), cleanedGM)
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
      const price = Number.parseFloat(GM.narxi.replace(/[^\d.]/g, "")) || 0
      const stock = GM.stock || 0
      return total + price * stock
    }, 0)
  } catch (error) {
    console.error("Error calculating inventory value:", error)
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

export const saveSaleGM = async (transaction: Omit<SaleGM, "id" | "createdAt">): Promise<string> => {
  try {
    const cleanedTransaction = removeUndefinedFields({
      ...transaction,
      createdAt: Timestamp.now(),
    })

    const docRef = await addDoc(collection(db, SALES_COLLECTION_NAME), cleanedTransaction)
    return docRef.id
  } catch (error) {
    console.error("Error saving sale transaction:", error)
    throw error
  }
}

export const getSaleGMs = async (): Promise<SaleGM[]> => {
  try {
    const q = query(collection(db, SALES_COLLECTION_NAME), orderBy("saleDate", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SaleGM,
    )
  } catch (error) {
    console.error("Error getting sale transactions:", error)
    throw error
  }
}

export const createLoan = async (loan: Omit<LoanRecord, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const cleanedLoan = removeUndefinedFields({
      ...loan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docRef = await addDoc(collection(db, LOANS_COLLECTION_NAME), cleanedLoan)
    return docRef.id
  } catch (error) {
    console.error("Error creating loan:", error)
    throw error
  }
}

export const getLoans = async (): Promise<LoanRecord[]> => {
  try {
    const q = query(collection(db, LOANS_COLLECTION_NAME), orderBy("loanDate", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LoanRecord,
    )
  } catch (error) {
    console.error("Error getting loans:", error)
    throw error
  }
}

export const updateLoan = async (id: string, updates: Partial<LoanRecord>): Promise<void> => {
  try {
    const docRef = doc(db, LOANS_COLLECTION_NAME, id)
    const cleanedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: Timestamp.now(),
    })
    await updateDoc(docRef, cleanedUpdates)
  } catch (error) {
    console.error("Error updating loan:", error)
    throw error
  }
}

export const addLoanPayment = async (loanId: string, amount: number, note?: string): Promise<void> => {
  try {
    const loans = await getLoans()
    const loan = loans.find((l) => l.id === loanId)

    if (!loan) {
      throw new Error("Loan not found")
    }

    const newAmountPaid = (loan.amountPaid || 0) + amount
    const newAmountRemaining = loan.totalAmount - newAmountPaid
    const newStatus = newAmountRemaining <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "pending"

    const paymentEntry = {
      amount,
      date: Timestamp.now(),
      note,
    }

    const updatedPaymentHistory = [...(loan.paymentHistory || []), paymentEntry]

    await updateLoan(loanId, {
      amountPaid: newAmountPaid,
      amountRemaining: Math.max(0, newAmountRemaining),
      status: newStatus,
      paymentHistory: updatedPaymentHistory,
    })

    // Also update the related sale transaction if exists
    if (loan.transactionId) {
      const docRef = doc(db, SALES_COLLECTION_NAME, loan.transactionId)
      await updateDoc(docRef, {
        loanStatus: newStatus,
        amountPaid: newAmountPaid,
        amountRemaining: Math.max(0, newAmountRemaining),
      })
    }
  } catch (error) {
    console.error("Error adding loan payment:", error)
    throw error
  }
}

export const getPendingLoans = async (): Promise<LoanRecord[]> => {
  try {
    const loans = await getLoans()
    return loans.filter((loan) => loan.status === "pending" || loan.status === "partial")
  } catch (error) {
    console.error("Error getting pending loans:", error)
    throw error
  }
}

export const getTotalLoanAmount = async (): Promise<number> => {
  try {
    const loans = await getLoans()
    return loans.reduce((total, loan) => total + (loan.amountRemaining || 0), 0)
  } catch (error) {
    console.error("Error calculating total loan amount:", error)
    throw error
  }
}
