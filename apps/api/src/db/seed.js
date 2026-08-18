import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const PASSWORD = "Password123!";
const hospitals = [
  ["igmh", "Indira Gandhi Memorial Hospital", "Kanbaa Aisaa Rani Hingun", "Kaafu Atoll", "Male", "+960 333 5335", 4.1755, 73.5093],
  ["adk", "ADK Hospital", "Sosun Magu", "Kaafu Atoll", "Male", "+960 331 3553", 4.1743, 73.5132],
  ["hul", "Hulhumale Hospital", "Huvandhumaa Hingun", "Kaafu Atoll", "Hulhumale", "+960 335 0037", 4.2117, 73.5401],
  ["kul", "Kulhudhuffushi Regional Hospital", "Ameenee Magu", "Haa Dhaalu Atoll", "Kulhudhuffushi", "+960 652 8864", 6.6221, 73.0699],
  ["ung", "Raa Atoll Hospital", "Hospital Road", "Raa Atoll", "Ungoofaaru", "+960 658 0036", 5.6681, 73.0302],
  ["hit", "Hithadhoo Regional Hospital", "Link Road", "Seenu Atoll", "Hithadhoo", "+960 689 5030", -0.6001, 73.0897],
];
const staff = [
  ["igmh.manager@demo.mv","Dr. Mariyam Shifa","hospital_manager","igmh"],["igmh.staff@demo.mv","Ahmed Nihan","hospital_staff","igmh"],
  ["adk.manager@demo.mv","Dr. Aishath Naza","hospital_manager","adk"],["adk.staff@demo.mv","Ibrahim Rasheed","hospital_staff","adk"],
  ["hulhumale.manager@demo.mv","Dr. Fathimath Leena","hospital_manager","hul"],["hulhumale.staff@demo.mv","Hassan Rilwan","hospital_staff","hul"],
  ["kulhudhuffushi.manager@demo.mv","Dr. Aminath Saeed","hospital_manager","kul"],["kulhudhuffushi.staff@demo.mv","Mohamed Shaheen","hospital_staff","kul"],
  ["ungoofaaru.manager@demo.mv","Dr. Hawwa Nisha","hospital_manager","ung"],["ungoofaaru.staff@demo.mv","Ali Sameer","hospital_staff","ung"],
  ["hithadhoo.manager@demo.mv","Dr. Zainab Shiyana","hospital_manager","hit"],["hithadhoo.staff@demo.mv","Abdulla Naeem","hospital_staff","hit"],
];
const people = [
  ["aminath.raiha@demo.mv","Aminath Raiha","A100001","Kaafu Atoll","Male","O+",true,null,null],
  ["mohamed.zaid@demo.mv","Mohamed Zaid","A100002","Kaafu Atoll","Male","A+",true,null,null],
  ["hawwa.meera@demo.mv","Hawwa Meera","A100003","Kaafu Atoll","Hulhumale","B+",true,null,null],
  ["ibrahim.shayaan@demo.mv","Ibrahim Shayaan","A100004","Kaafu Atoll","Hulhumale","AB+",false,"temporary","2026-10-20"],
  ["aishath.layaan@demo.mv","Aishath Layaan","A100005","Haa Dhaalu Atoll","Kulhudhuffushi","O-",true,null,null],
  ["ahmed.naail@demo.mv","Ahmed Naail","A100006","Haa Dhaalu Atoll","Kulhudhuffushi","A-",true,null,null],
  ["mariyam.reesha@demo.mv","Mariyam Reesha","A100007","Raa Atoll","Ungoofaaru","B-",true,null,null],
  ["ali.rameez@demo.mv","Ali Rameez","A100008","Raa Atoll","Ungoofaaru","AB-",false,"permanent",null],
  ["fathimath.yumna@demo.mv","Fathimath Yumna","A100009","Seenu Atoll","Hithadhoo","O+",true,null,null],
  ["hassan.riyaz@demo.mv","Hassan Riyaz","A100010","Seenu Atoll","Hithadhoo","A+",true,null,null],
  ["shiuza.saleem@demo.mv","Shiuza Saleem","A100011","Kaafu Atoll","Male","B+",true,null,null],
  ["abdulla.yaamin@demo.mv","Abdulla Yaamin","A100012","Kaafu Atoll","Male","O+",false,"temporary","2026-11-01"],
  ["maaisha.latheef@demo.mv","Maaisha Latheef","A100013","Kaafu Atoll","Hulhumale","A-",true,null,null],
  ["ismail.nabeel@demo.mv","Ismail Nabeel","A100014","Haa Dhaalu Atoll","Kulhudhuffushi","AB+",true,null,null],
  ["zainab.shazna@demo.mv","Zainab Shazna","A100015","Raa Atoll","Ungoofaaru","O-",true,null,null],
  ["yoosuf.ihsan@demo.mv","Yoosuf Ihsan","A100016","Seenu Atoll","Hithadhoo","B-",true,null,null],
];
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("TRUNCATE audit_logs,request_blood_bag_assignments,request_donor_assignments,blood_requests,blood_bags,patient_history_entries,donor_profiles,users,hospitals RESTART IDENTITY CASCADE");
  const hash = await bcrypt.hash(PASSWORD, 10), hid = {}, uid = {}, bag = {}, req = {};
  for (const h of hospitals) { const {rows}=await client.query(`INSERT INTO hospitals(name,address,city,atoll,island,phone,latitude,longitude,donation_open_time,donation_close_time,approved) VALUES($1,$2,$4,$3,$4,$5,$6,$7,'08:00','17:00',true) RETURNING id`,h.slice(1)); hid[h[0]]=rows[0].id; }
  async function addUser(email,name,role,hospital=null,phone=null,atoll=null,island=null,id=null) { const {rows}=await client.query(`INSERT INTO users(email,password_hash,full_name,role,hospital_id,phone,atoll,island,identification_type,identification_number) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,[email,hash,name,role,hospital,phone,atoll,island,id?"maldives_id":null,id]); uid[email]=rows[0].id; }
  await addUser("admin@demo.mv","Blood Bank Central Administrator","admin");
  for (const [e,n,r,h] of staff) { const x=hospitals.find(v=>v[0]===h); await addUser(e,n,r,hid[h],null,x[3],x[4]); }
  for (let i=0;i<people.length;i++) { const [e,n,id,a,island,blood,eligible,t,until]=people[i]; await addUser(e,n,"public",null,`+960 770${String(1001+i)}`,a,island,id); await client.query(`INSERT INTO donor_profiles(user_id,blood_type,date_of_birth,last_donation_date,eligible,eligibility_note,ineligibility_type,ineligible_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[uid[e],blood,`199${i%10}-0${i%9+1}-15`,eligible?"2026-04-10":"2026-07-20",eligible,eligible?null:(t==="permanent"?"Permanent medical deferral":"Three-month deferral"),t,until]); }
  const bagSpecs=[["IGMH",0,"igmh"],["IGMH",1,"igmh"],["ADK",2,"adk"],["ADK",3,"adk"],["HUL",11,"hul"],["HUL",12,"hul"],["KUL",4,"kul"],["KUL",5,"kul"],["KUL",13,"kul"],["UNG",6,"ung"],["UNG",7,"ung"],["UNG",14,"ung"],["HIT",8,"hit"],["HIT",9,"hit"],["HIT",15,"hit"],["IGMH",10,"igmh"],["ADK",0,"adk"],["HUL",1,"hul"]];
  let count=0;
  for (const [prefix,p,h] of bagSpecs) for(let c=1;c<=2;c++){ count++; const code=`${prefix}-${people[p][5].replace("+","P").replace("-","N")}-${String(c).padStart(3,"0")}`; const status=count%11===0?"quarantined":count%7===0?"issued":count%5===0?"reserved":"available"; const {rows}=await client.query(`INSERT INTO blood_bags(code,donor_id,blood_type,component,collected_at,expires_at,hospital_id,storage_location,notes,status) VALUES($1,$2,$3,$4,current_date-$5::integer,current_date+$6::integer,$7,$8,'Fictional college demonstration stock',$9) RETURNING id`,[code,uid[people[p][0]],people[p][5],c===1?"Whole Blood":"Packed Red Cells",12+count,8+count%25,hid[h],`Cold Room ${c===1?"A":"B"}`,status]); bag[code]=rows[0].id; }
  const requests=[["MLE1",0,"igmh",2,"critical","pending",2,"public"],["MLE2",1,"adk",1,"urgent","accepted",3,"staff_only"],["HUL1",2,"hul",2,"normal","pending",7,"public"],["KUL1",4,"kul",1,"urgent","accepted",4,"public"],["UNG1",6,"ung",1,"normal","fulfilled",-2,"staff_only"],["HIT1",8,"hit",2,"critical","fulfilled",-5,"public"]];
  for(const [ref,p,h,units,urgency,status,days,visibility] of requests){const x=people[p],loc=hospitals.find(v=>v[0]===h);const {rows}=await client.query(`INSERT INTO blood_requests(requester_id,hospital_id,patient_name,patient_id_type,patient_id_number,blood_type,units,urgency,status,needed_by,request_atoll,request_island,contact_detail,visibility,notes) VALUES($1,$2,$3,'maldives_id',$4,$5,$6,$7,$8,current_date+$9::integer,$10,$11,$12,$13,$14) RETURNING id`,[uid[x[0]],hid[h],x[1],x[2],x[5],units,urgency,status,days,loc[3],loc[4],visibility==="public"?`+960 770${1001+p}`:null,visibility,"Fictional demonstration request"]);req[ref]=rows[0].id;}
  const bagAssignments=[["MLE2","IGMH-AP-001","igmh.staff@demo.mv"],["KUL1","KUL-ON-001","kulhudhuffushi.staff@demo.mv"],["UNG1","UNG-BN-001","ungoofaaru.staff@demo.mv"],["HIT1","HIT-OP-001","hithadhoo.staff@demo.mv"]];
  for(const [r,b,s] of bagAssignments){const done=requests.find(x=>x[0]===r)[5]==="fulfilled";await client.query(`INSERT INTO request_blood_bag_assignments VALUES($1,$2,$3,now())`,[req[r],bag[b],uid[s]]);await client.query(`UPDATE blood_bags SET status=$1,assigned_patient_id=(SELECT requester_id FROM blood_requests WHERE id=$2),reserved_by=$3,reserved_at=now(),issued_by=$4,issued_at=$5 WHERE id=$6`,[done?"issued":"reserved",req[r],uid[s],done?uid[s]:null,done?new Date():null,bag[b]]);}
  for(const [r,p,s] of [["MLE1",11,"igmh.staff@demo.mv"],["HUL1",10,"hulhumale.staff@demo.mv"],["KUL1",14,"kulhudhuffushi.staff@demo.mv"]]) await client.query(`INSERT INTO request_donor_assignments VALUES($1,$2,$3,now())`,[req[r],uid[people[p][0]],uid[s]]);
  const histories=[[0,"igmh","igmh.staff@demo.mv","clinical_note","Pre-donation screening","Vitals normal",-128],[1,"adk","adk.staff@demo.mv","diagnosis","Mild iron deficiency","Dietary advice provided",-80],[2,"hul","hulhumale.staff@demo.mv","procedure","Blood donation","Donation completed without complications",-101],[4,"kul","kulhudhuffushi.staff@demo.mv","clinical_note","Rare blood group review","O negative details confirmed",-44],[6,"ung","ungoofaaru.staff@demo.mv","transfusion","One unit transfused","B negative unit transfused successfully",-2],[8,"hit","hithadhoo.staff@demo.mv","transfusion","Emergency transfusion","O positive unit issued and transfused",-5],[11,"igmh","igmh.staff@demo.mv","other","Temporary donor deferral","Ineligible until 1 November 2026",-29]];
  const history=[];for(const [p,h,s,t,title,d,days] of histories){const {rows}=await client.query(`INSERT INTO patient_history_entries(patient_id,hospital_id,created_by,entry_type,title,details,occurred_at) VALUES($1,$2,$3,$4,$5,$6,current_date+$7::integer) RETURNING id`,[uid[people[p][0]],hid[h],uid[s],t,title,d,days]);history.push(rows[0].id);}
  const audits=[["igmh.staff@demo.mv","blood_bag.reserved","blood_bag",bag["IGMH-AP-001"]],["ungoofaaru.staff@demo.mv","blood_bag.issued","blood_bag",bag["UNG-BN-001"]],["hithadhoo.staff@demo.mv","blood_bag.issued","blood_bag",bag["HIT-OP-001"]],["kulhudhuffushi.staff@demo.mv","request.donor_assigned","blood_request",req.KUL1],["adk.manager@demo.mv","patient_history.created","patient_history",history[1]],["igmh.staff@demo.mv","donor.eligibility_updated","user",uid[people[11][0]]],["admin@demo.mv","hospital.approved","hospital",hid.hit]];
  for(const [e,a,t,id] of audits) await client.query(`INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)`,[uid[e],a,t,id,{seeded:true}]);
  await client.query("COMMIT");
  console.log(`Seeded ${hospitals.length} hospitals, ${staff.length+people.length+1} users, ${bagSpecs.length*2} bags, and ${requests.length} requests.`);
} catch(error){await client.query("ROLLBACK");throw error;} finally{client.release();await pool.end();}
