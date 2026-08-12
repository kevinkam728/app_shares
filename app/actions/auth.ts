'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as 'user' | 'advisor'
  const file = formData.get('cnvPdf') as File | null

  const supabase = createClient()

  // 1. Auth SignUp
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Error creating user' }

  let cnv_pdf_url = null

  // 2. Upload file if Advisor
  if (role === 'advisor' && file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${authData.user.id}/${Math.random()}.${fileExt}`
    
    const { error: uploadError, data } = await supabase.storage
      .from('cnv_certs')
      .upload(fileName, file)

    if (uploadError) return { error: 'Error uploading certificate' }
    
    const { data: publicUrlData } = supabase.storage
      .from('cnv_certs')
      .getPublicUrl(fileName)
      
    cnv_pdf_url = publicUrlData.publicUrl
  }

  // 3. Create Profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role: role === 'advisor' ? 'pending_advisor' : 'user',
    cnv_pdf_url,
  })

  if (profileError) return { error: 'Error creating profile' }

  revalidatePath('/')
  return { success: true }
}

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }
  
  revalidatePath('/')
  return { success: true }
}
