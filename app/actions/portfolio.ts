'use server'

import { createClient } from '@/lib/supabase/server'
import { getStockData } from './finance'

export async function buyStockAction(formData: FormData) {
  const supabase = await createClient()
  const ticker = formData.get('ticker') as string
  const amount = parseFloat(formData.get('amount') as string)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // 1. Get Portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!portfolio || portfolio.balance_usd < amount) return { error: 'Fondos insuficientes' }

  // 2. Get Price
  const stock = await getStockData(ticker)
  if (!stock) return { error: 'Ticker inválido' }

  // 3. Perform Transaction
  const { error: tradeError } = await supabase.from('simulated_trades').insert({
    portfolio_id: portfolio.id,
    ticker,
    amount_invested: amount,
    buy_price: stock.regularMarketPrice
  })

  if (tradeError) return { error: 'Error registrando compra' }

  const { error: updateError } = await supabase
    .from('portfolios')
    .update({ balance_usd: portfolio.balance_usd - amount })
    .eq('id', portfolio.id)

  if (updateError) return { error: 'Error actualizando saldo' }

  return { success: true }
}
