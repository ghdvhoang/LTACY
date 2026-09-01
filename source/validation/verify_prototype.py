from pathlib import Path
import json
import os
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'yen-center-lms-demo.html').read_text(encoding='utf-8')
STATE_KEY='yen-center-lms-fe-state-v2'
SESSION_KEY='yen-center-lms-fe-session-v2'
STORAGE_SHIM="""() => { const mk=()=>{const m=new Map(); return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]||null,get length(){return m.size}}}; Object.defineProperty(window,'localStorage',{value:mk(),configurable:true}); Object.defineProperty(window,'sessionStorage',{value:mk(),configurable:true}); }"""
PUBLIC_ROUTES=['/','/phu-huynh-hoc-sinh','/giai-phap-trung-tam','/chuong-trinh','/lich-hoc','/tin-tuc','/su-kien','/tai-lieu','/lien-he','/faq','/dieu-khoan-su-dung','/chinh-sach-bao-mat','/login','/demo-guide']
ROLE_ROUTES={
'STUDENT':['/app/student/dashboard','/app/student/lessons','/app/student/remedial','/app/student/results','/app/student/progress','/app/student/notifications'],
'TEACHER':['/app/teacher/dashboard','/app/teacher/classes','/app/teacher/sessions','/app/teacher/remedial','/app/teacher/content','/app/teacher/reports','/app/teacher/notifications'],
'TA':['/app/teacher/dashboard','/app/teacher/classes','/app/teacher/sessions','/app/teacher/remedial','/app/teacher/content','/app/teacher/reports','/app/teacher/notifications'],
'ADMIN':['/app/admin/dashboard','/app/admin/users','/app/admin/students','/app/admin/classes','/app/admin/courses','/app/admin/remedial','/app/admin/contacts','/app/admin/reports','/app/admin/integrations','/app/admin/audit-logs','/app/admin/settings']}
SESSIONS={
'STUDENT':{'userId':'student-login-1','selectedStudentId':'student-01','pendingStudentIds':None},
'TEACHER':{'userId':'teacher-1','selectedStudentId':None,'pendingStudentIds':None},
'TA':{'userId':'ta-1','selectedStudentId':None,'pendingStudentIds':None},
'ADMIN':{'userId':'admin-1','selectedStudentId':None,'pendingStudentIds':None},}

def make_page(browser, viewport={'width':1440,'height':1000}):
    context=browser.new_context(viewport=viewport, accept_downloads=True)
    page=context.new_page()
    errors=[]
    page.on('console',lambda m: errors.append(f'console:{m.text}') if m.type=='error' else None)
    page.on('pageerror',lambda e: errors.append(f'page:{e}'))
    page.evaluate(STORAGE_SHIM)
    page.set_content(HTML,wait_until='load')
    page.wait_for_timeout(120)
    return context,page,errors

def set_hash(page,path):
    page.evaluate("p => { location.hash = p; window.dispatchEvent(new HashChangeEvent('hashchange')); }",path)
    page.wait_for_timeout(100)

def set_role(page,role):
    page.evaluate("([k,v])=>sessionStorage.setItem(k,JSON.stringify(v))",[SESSION_KEY,SESSIONS[role]])

def get_state(page): return page.evaluate("k=>JSON.parse(localStorage.getItem(k))",STATE_KEY)

def assert_route(page,path):
    set_hash(page,path)
    body=page.locator('body').inner_text()
    assert len(body.strip())>50,(path,len(body))
    assert 'Không tìm thấy trang' not in body,path
    assert 'Đã xảy ra lỗi' not in body,path

results={'public_routes':0,'authenticated_routes':0,'data_invariants':False,'rbac':False,'forms':False,'guardian_profile_chooser':False,'link_lifecycle':False,'core_e2e':False,'download':False,'standalone':False,'role_visual_tokens':False,'errors':[]}
with sync_playwright() as pw:
    launch_args={'headless': True, 'args': ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}
    executable=os.environ.get('CHROMIUM_EXECUTABLE')
    if executable:
        launch_args['executable_path']=executable
    elif Path('/usr/bin/chromium').exists():
        launch_args['executable_path']='/usr/bin/chromium'
    browser=pw.chromium.launch(**launch_args)
    # Public + seed
    ctx,p,e=make_page(browser)
    for r in PUBLIC_ROUTES:
        assert_route(p,r); results['public_routes']+=1
    inv=p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));return {students:s.students.length,classes:s.classes.length,lessons:s.lessons.length,videos:s.videos.length,questions:s.questions.length,assignments:s.assignments.length,missingVideos:s.lessons.filter(l=>!s.videos.some(v=>v.id===l.videoId)).length,badAssignments:s.assignments.filter(a=>{const st=s.students.find(x=>x.id===a.studentId),ss=s.sessions.find(x=>x.id===a.sessionId);return !st||!ss||st.classId!==ss.classId||a.lessonId!==ss.lessonId||!s.quizzes.some(q=>q.id===a.quizId)}).length,absentWithout:s.attendance.filter(a=>a.status==='ABSENT'&&!s.assignments.some(x=>x.studentId===a.studentId&&x.sessionId===a.sessionId)).length}}""",STATE_KEY)
    assert inv=={'students':74,'classes':3,'lessons':24,'videos':128,'questions':80,'assignments':12,'missingVideos':0,'badAssignments':0,'absentWithout':0},inv
    results['data_invariants']=True
    assert not e,e; ctx.close()

    # Routes + visual tokens
    ctx,p,e=make_page(browser)
    token_values={}
    for role,routes in ROLE_ROUTES.items():
        set_role(p,role)
        for r in routes:
            assert_route(p,r); results['authenticated_routes']+=1
        set_hash(p,routes[0])
        token_values[role]=p.locator('.app-layout').evaluate("el=>getComputedStyle(el).getPropertyValue('--role-accent').trim()")
    assert token_values=={'STUDENT':'#155eef','TEACHER':'#087f5b','TA':'#a55b08','ADMIN':'#6e56cf'},token_values
    results['role_visual_tokens']=True
    set_role(p,'STUDENT'); assert_route(p,'/app/admin/dashboard'); assert 'Không có quyền truy cập' in p.locator('body').inner_text()
    set_role(p,'TEACHER'); assert_route(p,'/app/admin/users'); assert 'Không có quyền truy cập' in p.locator('body').inner_text()
    results['rbac']=True
    assert not e,e; ctx.close()

    # Forms + guardian
    ctx,p,e=make_page(browser)
    base=len(get_state(p)['leads'])
    set_hash(p,'/phu-huynh-hoc-sinh')
    form=p.locator('form[data-form="lead"][data-type="B2C"]')
    form.locator('[name="name"]').fill('Nguyễn Test PO')
    form.locator('[name="phone"]').fill('0901234567')
    form.locator('[name="studentName"]').fill('Bé Minh')
    form.locator('[name="grade"]').select_option(label='Khối 6')
    form.locator('[name="preferredTime"]').select_option(label='Buổi tối')
    form.locator('[name="message"]').fill('Cần tư vấn học bù')
    form.locator('[name="consent"]').check(); form.locator('button[type="submit"]').click(); p.wait_for_timeout(80)
    assert len(get_state(p)['leads'])==base+1
    set_hash(p,'/login')
    login=p.locator('form[data-form="login"]'); login.locator('[name="identifier"]').fill('0901000002'); login.locator('[name="secret"]').fill('123456'); login.locator('button[type="submit"]').click(); p.wait_for_timeout(100)
    assert p.get_by_text('Chọn hồ sơ học sinh.').is_visible(); assert p.locator('[data-action="select-student-profile"]').count()==2
    results['forms']=True; results['guardian_profile_chooser']=True
    assert not e,e; ctx.close()

    # Link lifecycle + core E2E + export
    ctx,p,e=make_page(browser)
    set_hash(p,'/login'); p.locator('[data-action="quick-login"][data-user-id="admin-1"]').click(); p.wait_for_timeout(80)
    set_hash(p,'/app/admin/remedial')
    fid=get_state(p)['assignments'][0]['id']
    p.locator(f'[data-action="open-link-manager"][data-assignment-id="{fid}"]').click(); before=next(a for a in get_state(p)['assignments'] if a['id']==fid)['linkVersion']
    p.locator(f'[data-action="regenerate-assignment-link"][data-assignment-id="{fid}"]').click(); after=next(a for a in get_state(p)['assignments'] if a['id']==fid); assert after['linkVersion']==before+1
    p.on('dialog',lambda d:d.accept())
    p.locator(f'[data-action="revoke-assignment-link"][data-assignment-id="{fid}"]').click(); p.wait_for_timeout(80); assert next(a for a in get_state(p)['assignments'] if a['id']==fid)['accessStatus']=='REVOKED'
    results['link_lifecycle']=True
    # reset UI data
    p.evaluate("k=>localStorage.removeItem(k)",STATE_KEY); p.evaluate("k=>sessionStorage.removeItem(k)",SESSION_KEY); p.set_content(HTML,wait_until='load'); p.wait_for_timeout(100)
    set_hash(p,'/login'); p.locator('[data-action="quick-login"][data-user-id="teacher-1"]').click(); p.wait_for_timeout(80)
    set_hash(p,'/app/teacher/sessions/session-canonical/attendance')
    p.locator('[data-action="attendance-all-present"]').click(); p.locator('[data-att-row="student-01"] [data-status="ABSENT"]').click(); p.locator('[data-action="save-attendance"]').click(); p.wait_for_timeout(120)
    s=get_state(p); cand=[a for a in s['assignments'] if a['sessionId']=='session-canonical' and a['studentId']=='student-01']; assert len(cand)==1; cid=cand[0]['id']
    p.locator('[data-action="logout"]').first.click(); p.wait_for_timeout(60); p.locator('[data-action="quick-login"][data-user-id="student-login-1"]').click(); p.wait_for_timeout(60)
    set_hash(p,f'/app/student/remedial/{cid}'); p.locator(f'[data-action="video-progress"][data-assignment-id="{cid}"][data-value="100"]').click(); p.locator('a',has_text='Làm bài kiểm tra').click(); p.locator('[data-action="fill-demo-quiz"]').click(); p.locator('form[data-form="quiz"] button[type="submit"]').click(); p.wait_for_timeout(120)
    assert 'Đã bù xong' in p.locator('body').inner_text() and '80/100' in p.locator('body').inner_text(); comp=next(a for a in get_state(p)['assignments'] if a['id']==cid); assert comp['lifecycleStatus']=='COMPLETED' and comp['score']==80
    set_role(p,'ADMIN'); set_hash(p,'/app/admin/audit-logs'); assert 'REMEDIAL_COMPLETED_AUTO' in p.locator('body').inner_text(); results['core_e2e']=True
    set_hash(p,'/app/admin/reports')
    p.evaluate("""()=>{window.__downloadCapture={filename:null,blob:null};const oc=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.__downloadCapture.blob=b;return oc(b)};HTMLAnchorElement.prototype.click=function(){window.__downloadCapture.filename=this.download}}""")
    p.locator('[data-action="export-session-report"]').click(); cap=p.evaluate("""async()=>({filename:window.__downloadCapture.filename,text:window.__downloadCapture.blob?await window.__downloadCapture.blob.text():''})"""); assert cap['filename'].endswith('.csv') and len(cap['text'])>100 and 'Ngày giờ' in cap['text']; results['download']=True
    assert not e,e; ctx.close()

    # Standalone smoke + mobile style
    ctx,p,e=make_page(browser,{'width':390,'height':844}); assert p.locator('h1').first.inner_text().strip(); set_hash(p,'/login'); assert p.locator('[data-action="quick-login"]').count()==4; results['standalone']=True; assert not e,e; ctx.close()
    browser.close()
output=json.dumps(results,ensure_ascii=False,indent=2)
print(output)
(ROOT/'validation'/'verification-result.json').write_text(output+'\n',encoding='utf-8')
