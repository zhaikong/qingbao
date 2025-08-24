import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    zhipu_key_exists: !!process.env.ZHIPU_API_KEY,
    zhipu_key_length: process.env.ZHIPU_API_KEY?.length || 0,
    zhipu_key_prefix: process.env.ZHIPU_API_KEY?.substring(0, 10) || 'not found',
    all_env_keys: Object.keys(process.env).filter(key => key.includes('ZHIPU'))
  });
}