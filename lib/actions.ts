"use server"

import { CustomerPaymentData, DMCPaymentData, Reminder } from "@/lib/types"

// Customer Payment Actions
export async function getCustomerPayment(itineraryReference: string) {
  // In a real application, you would fetch this data from your database
  // For now, we'll return mock data
  
  const payment: CustomerPaymentData = {
    customerName: 'Miguel Hernandez',
    itineraryReference: itineraryReference,
    totalCost: '1,280.00',
    amountPaid: '500.00',
    paymentDate: '12-04-25',
    remainingBalance: '780.00',
    paymentStatus: 'Partial',
    shareMethod: 'whatsapp',
    paymentLink: 'https://rzp-test.razorpay.com/l/abc123xyz'
  }
  
  const reminders: Reminder[] = [
    {
      id: 1,
      type: 'Payment pending',
      message: 'Customer is satisfied with the entire itinerary. No changes requested. Proceeding with confirmation and sending to DMC.',
      time: '02:00 PM',
      date: 'Today',
      status: 'RECENT'
    }
  ]
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return { payment, reminders }
}

export async function updateCustomerPayment(paymentData: CustomerPaymentData) {
  // In a real application, you would update this data in your database
  // For now, we'll just simulate an API call
  console.log('Updating customer payment:', paymentData)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return { success: true }
}

export async function sendPaymentReminder(itineraryReference: string, method: 'whatsapp' | 'email') {
  // In a real application, you would send a reminder via the specified method
  // For now, we'll just simulate an API call and return a new reminder
  console.log(`Sending payment reminder for ${itineraryReference} via ${method}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const newReminder: Reminder = {
    id: Date.now(),
    type: 'Reminder sent',
    message: `Payment reminder sent via ${method}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: 'Today',
    status: 'SENT'
  }
  
  return newReminder
}

// DMC Payment Actions
export async function getDMCPayment(itineraryReference: string) {
  // In a real application, you would fetch this data from your database
  // For now, we'll return mock data
  
  const payment: DMCPaymentData = {
      dmcName: 'Maple Trails DMC',
      itineraryReference: itineraryReference,
      paymentMode: 'Offline',
      totalCost: '1,100.00',
      amountPaid: '500.00',
      paymentDate: '13 - 04 - 25',
      remainingBalance: '600.00',
      paymentStatus: 'Partial',
      paymentChannel: 'Bank transfer ( manual entry )',
      transactionId: '41431545',
      selectedBank: 'Wells Fargo Bank, N.A. ( 987654321098 )',
      paymentGateway: 'https://pages.razorpay.com/family-camping',
      id: "",
      currency: ""
  }
  
  const reminders: Reminder[] = [
    {
      id: 1,
      type: 'Payment pending',
      message: 'Customer is satisfied with the entire itinerary. No changes requested. Proceeding with confirmation and sending to DMC.',
      time: '02:00 PM',
      date: 'Today',
      status: 'RECENT'
    }
  ]
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return { payment, reminders }
}

export async function updateDMCPayment(paymentData: DMCPaymentData) {
  // In a real application, you would update this data in your database
  // For now, we'll just simulate an API call
  console.log('Updating DMC payment:', paymentData)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return { success: true }
}

export async function sendDMCReminder(itineraryReference: string) {
  // In a real application, you would send a reminder to the DMC
  // For now, we'll just simulate an API call and return a new reminder
  console.log(`Sending DMC reminder for ${itineraryReference}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const newReminder: Reminder = {
    id: Date.now(),
    type: 'Reminder sent',
    message: 'Payment reminder sent to DMC',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: 'Today',
    status: 'SENT'
  }
  
  return newReminder
}