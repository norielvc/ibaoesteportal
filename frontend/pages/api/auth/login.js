import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // 1. Search for the user globally by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 2. Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // 3. Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Update last login
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1
      })
      .eq('id', user.id);

    // 5. Generate token (Same secret used across all services)
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // 6. Prepare user response
    const userResponse = {
      id: user.id,
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      tenant_id: user.tenant_id,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } catch (error) {
    console.error('API Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
