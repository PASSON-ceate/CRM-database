# Key Account Hub — Deploy ฟรี (Vercel + Supabase)

## 1) Supabase (ฐานข้อมูล + ล็อกอิน)
1. สมัคร supabase.com → New project (แพ็กเกจ Free) เลือก region Singapore
2. เมนู **SQL Editor** → วางไฟล์ `supabase.sql` → Run
3. เมนู **Authentication → Sign In / Providers → Email**: ปิด **Allow new users to sign up** (กันคนนอกสมัครเอง)
4. เมนู **Authentication → Users → Add user**: เพิ่มอีเมล @entech.co.th + รหัสผ่านของแต่ละคน (ติ๊ก Auto Confirm)
5. เมนู **Project Settings → API**: คัดลอก **Project URL** และ **anon public key**

## 2) ตั้งค่าและสร้างหน้าเว็บ
1. เปิด `config.js` แล้วใส่ URL และ anon key
2. รัน `python3 build.py` → ได้โฟลเดอร์ `public/` (index.html, import.html)

## 3) Vercel
- วิธีง่ายสุด: อัปโหลดโฟลเดอร์นี้ขึ้น GitHub แล้ว vercel.com → Add New Project → เลือก repo → **Output Directory = public**, Build Command ว่าง → Deploy
- หรือใช้ CLI: `npm i -g vercel` แล้ว `vercel --prod` (ตอนถามให้ตั้ง output เป็น `public`)
(ถ้าไม่อยากใช้ Python บนเครื่อง ให้รัน build.py ที่เครื่องไหนก็ได้ แล้วอัปโหลดเฉพาะ `public/` + `vercel.json`)

## 4) ย้ายข้อมูลเดิม
1. ในหน้า Artifact เดิม (v50) กดปุ่ม **สำรองข้อมูลทั้งหมด (ไฟล์ JSON)** ใต้ตาราง
2. เปิด `https://<โดเมนของคุณ>/import` → ล็อกอิน → เลือกไฟล์ JSON → นำเข้า

หมายเหตุ: ฟรีแพ็กเกจ Supabase จะ pause โปรเจกต์ถ้าไม่มีการใช้งาน 7 วัน (กด Restore ได้) และ RLS จำกัดเฉพาะอีเมล @entech.co.th
