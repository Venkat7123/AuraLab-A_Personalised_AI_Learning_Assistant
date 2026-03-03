import { supabaseAdmin } from '../config/supabase.js'

export const getUserProfile = async (supabase, userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw new Error('Failed to fetch user profile')
    }

    return data
}

export const updateUserName = async (supabase, userId, name) => {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { name }
    })

    if (authError) {
        throw new Error('Failed to update name in authentication')
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            user_id: userId,
            name,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        throw new Error('Failed to update profile name')
    }

    return { success: true, name }
}

export const updateUserPassword = async (supabase, newPassword) => {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        throw new Error('Failed to update password')
    }

    return { success: true, message: 'Password updated successfully' }
}

export const updateUserEmail = async (supabase, newEmail) => {
    const { error } = await supabase.auth.updateUser({
        email: newEmail
    })

    if (error) {
        throw new Error('Failed to update email')
    }

    return { success: true, message: 'Email update initiated. Please check your new email for confirmation.' }
}

export const updateUserAvatar = async (supabase, userId, avatarData) => {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            user_id: userId,
            avatar_url: avatarData.avatar_url,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        throw new Error('Failed to update avatar')
    }

    return data
}

export const deleteUserAccount = async (supabase, userId) => {
    // 1. Delete the profile data (though cascade might handle it)
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)

    if (profileError) {
        throw new Error('Failed to delete profile data')
    }

    // 2. Delete the actual auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
        throw new Error('Failed to delete authentication account')
    }

    return { success: true, message: 'Account deleted successfully' }
}
