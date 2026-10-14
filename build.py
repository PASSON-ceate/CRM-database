# python3 build.py  -> สร้าง public/index.html จาก ../key-account.html + shim.js
import os,re
src=open('../key-account.html',encoding='utf-8').read()
shim=open('shim.js',encoding='utf-8').read()
cfg=open('config.js',encoding='utf-8').read()
src=src.replace('<div class="dbg" id="dbg"></div>','<div class="dbg" id="dbg" hidden></div>')
head='<!doctype html>\n<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">\n'
i=src.index('<style>')
title_end=src.index('</title>')+8
body_start=src.index('</style>')+8
page=head+src[:body_start]+'\n</head><body>\n'+src[body_start:]
page=page.replace('<script>','<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n<script>'+cfg+'</script>\n<script>'+shim+'</script>\n<script>',1)
page+='\n</body></html>'
os.makedirs('public',exist_ok=True)
open('public/index.html','w',encoding='utf-8').write(page)
print('ok',len(page))

imp='''<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>นำเข้าข้อมูล</title>
<style>body{font-family:"IBM Plex Sans Thai",system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px}button{padding:10px 16px;font:inherit}pre{background:#f3f4f6;padding:10px;white-space:pre-wrap}</style></head><body>
<h1>นำเข้าข้อมูลจากไฟล์สำรอง (JSON)</h1>
<p>เลือกไฟล์ <b>key-account-backup-….json</b> ที่ได้จากปุ่ม “สำรองข้อมูลทั้งหมด” ในหน้าเดิม ข้อมูลที่มี id เดียวกันจะถูกเขียนทับ ไม่สร้างซ้ำ</p>
<input type="file" id="f" accept=".json,application/json"> <button id="go" disabled>นำเข้า</button><pre id="log"></pre>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script>'''+cfg+'''</script><script>'''+shim+'''</script>
<script>
var data=null,log=function(t){document.getElementById('log').textContent+=t+'\\n'};
document.getElementById('f').onchange=function(){var r=new FileReader();r.onload=function(){try{data=JSON.parse(r.result);document.getElementById('go').disabled=false;log('อ่านไฟล์แล้ว')}catch(e){log('ไฟล์ไม่ถูกต้อง')}};r.readAsText(this.files[0])};
document.getElementById('go').onclick=function(){
  this.disabled=true;
  claude.use('db').then(function(db){
    if(!db){log('ยังไม่ได้ตั้งค่า Supabase');return}
    var names=['key_accounts','crm_deals','quote_forms','group_logos','dash_todos'],p=Promise.resolve();
    names.forEach(function(n){(data[n]||[]).forEach(function(d){p=p.then(function(){return db.collection(n).doc(d.id).set(d.data)})});p=p.then(function(){log(n+': '+(data[n]||[]).length+' รายการ')})});
    return p.then(function(){log('เสร็จแล้ว')},function(e){log('ผิดพลาด: '+(e&&e.message||e))});
  });
};
</script></body></html>'''
open('public/import.html','w',encoding='utf-8').write(imp)
