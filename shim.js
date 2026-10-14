/* Replaces the Claude Artifact runtime (window.claude) with Supabase: login + shared "docs" table. */
(function(){
  var cfg=window.APP_CONFIG||{};
  var sb=null, ready=null;
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  function loginUI(){
    return new Promise(function(resolve){
      var o=document.createElement('div');
      o.style.cssText='position:fixed;inset:0;z-index:99999;background:#f3f4f6;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"IBM Plex Sans Thai",system-ui,sans-serif';
      o.innerHTML='<form style="background:#fff;border:1px solid #dcdfe4;border-radius:12px;padding:28px;width:min(360px,100%);box-shadow:0 8px 30px rgba(0,0,0,.08)">'
        +'<h1 style="margin:0 0 4px;font-size:20px">Key Account Hub</h1><p style="margin:0 0 18px;color:#667;font-size:13px">เข้าสู่ระบบเพื่อใช้งาน</p>'
        +'<label style="font-size:13px">อีเมล<input id="lgE" type="email" required autocomplete="username" style="display:block;width:100%;box-sizing:border-box;margin:4px 0 12px;padding:10px;border:1px solid #cfd3d9;border-radius:6px;font:inherit"></label>'
        +'<label style="font-size:13px">รหัสผ่าน<input id="lgP" type="password" required autocomplete="current-password" style="display:block;width:100%;box-sizing:border-box;margin:4px 0 12px;padding:10px;border:1px solid #cfd3d9;border-radius:6px;font:inherit"></label>'
        +'<div id="lgM" style="color:#c0392b;font-size:13px;min-height:18px;margin-bottom:8px"></div>'
        +'<button style="width:100%;padding:10px;border:0;border-radius:6px;background:#0f6f7c;color:#fff;font:inherit;font-weight:500;cursor:pointer">เข้าสู่ระบบ</button></form>';
      document.body.appendChild(o);
      o.querySelector('form').onsubmit=function(e){
        e.preventDefault();var m=o.querySelector('#lgM');m.textContent='';
        sb.auth.signInWithPassword({email:o.querySelector('#lgE').value.trim(),password:o.querySelector('#lgP').value}).then(function(r){
          if(r.error){m.textContent='อีเมลหรือรหัสผ่านไม่ถูกต้อง';return}
          o.remove();resolve(r.data.session);
        },function(){m.textContent='เชื่อมต่อไม่ได้ ลองอีกครั้ง'});
      };
    });
  }
  function logoutBtn(email){
    var b=document.createElement('button');
    b.textContent='ออกจากระบบ ('+email+')';
    b.style.cssText='position:fixed;right:10px;bottom:8px;z-index:50;font:12px "IBM Plex Sans Thai",system-ui;padding:4px 10px;border:1px solid #cfd3d9;border-radius:6px;background:#fff;cursor:pointer;opacity:.85';
    b.onclick=function(){sb.auth.signOut().then(function(){location.reload()})};
    document.body.appendChild(b);
  }

  function init(){
    if(ready)return ready;
    ready=new Promise(function(resolve){
      if(!cfg.SUPABASE_URL||/YOUR_/.test(cfg.SUPABASE_URL)||!window.supabase){resolve(null);return}
      sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      sb.auth.getSession().then(function(r){return r.data&&r.data.session?r.data.session:loginUI()}).then(function(s){
        logoutBtn((s&&s.user&&s.user.email)||'');resolve(sb);
      });
    });
    return ready;
  }

  function fetchAll(name){
    var out=[],step=1000;
    function page(from){
      return sb.from('docs').select('id,data').eq('collection',name).order('id').range(from,from+step-1).then(function(r){
        if(r.error)throw r.error;
        out=out.concat(r.data||[]);
        return (r.data&&r.data.length===step)?page(from+step):out;
      });
    }
    return page(0);
  }
  function snapOf(rows){return {docs:rows.map(function(r){return {id:r.id,data:function(){return Object.freeze(Object.assign({},r.data||{}))}}})}}
  function ok(r){if(r&&r.error)return Promise.reject(r.error);return r}

  function collection(name){
    return {
      get:function(){return fetchAll(name).then(snapOf)},
      onSnapshot:function(cb,errCb){
        var dead=false,timer=null;
        function load(){fetchAll(name).then(function(rows){if(!dead)cb(snapOf(rows))},function(e){if(!dead&&errCb)errCb(e)})}
        function soon(){clearTimeout(timer);timer=setTimeout(load,150)}
        load();
        var ch=sb.channel('docs-'+name+'-'+Math.random().toString(36).slice(2))
          .on('postgres_changes',{event:'*',schema:'public',table:'docs'},function(p){
            var rec=p.new&&p.new.collection?p.new:p.old;
            if(!rec||!rec.collection||rec.collection===name)soon();
          }).subscribe();
        var poll=setInterval(load,60000);
        return function(){dead=true;clearTimeout(timer);clearInterval(poll);sb.removeChannel(ch)};
      },
      doc:function(id){
        id=id||(window.crypto&&crypto.randomUUID?crypto.randomUUID():('d'+Date.now()+Math.random().toString(36).slice(2)));
        return {id:id,
          set:function(d){return sb.from('docs').upsert({collection:name,id:id,data:d}).then(ok)},
          update:function(d){return sb.rpc('docs_merge',{c:name,i:id,d:d}).then(ok)},
          delete:function(){return sb.from('docs').delete().eq('collection',name).eq('id',id).then(ok)}};
      }
    };
  }

  var downloads={save:function(o){
    var blob=new Blob([o.data],{type:/\.json$/.test(o.filename)?'application/json':'text/csv;charset=utf-8'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=o.filename;document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);return Promise.resolve();
  }};

  window.claude={use:function(x){
    if(x==='downloads')return Promise.resolve(downloads);
    if(x==='user')return Promise.resolve({can:function(){return true}});
    if(x==='db')return init().then(function(c){return c?{collection:collection}:null});
    return Promise.resolve(null);
  }};
  window.__sbClient=function(){return sb};
})();
