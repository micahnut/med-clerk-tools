import { useEffect, useMemo, useState } from 'react';

const DRAFT_STORAGE_KEY = 'med-tools-form-draft-v1';

function readLocalDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return {};
    return saved;
  } catch {
    return {};
  }
}

const obTextFields = [
  ['name','NAME'], ['age','AGE'], ['mrn','MRN'], ['obScore','OB SCORE'],
  ['religion','RELIGION'], ['status','STATUS'], ['address','ADDRESS'], ['occupation','OCCUPATION'],
  ['cc','CC'], ['ccDateTime','CC date / time'], ['hpi','HPI'],
  ['menstrualM','M'], ['menstrualI','I'], ['menstrualD','D'], ['menstrualAmount','A'], ['menstrualAssociated','A'],
  ['sexualC1','C'], ['sexualP1','P'], ['sexualC2','C'], ['sexualP2','P'], ['sexualS','S'],
  ['obs','OBS'], ['lmp','LMP'], ['pmp','PMP'], ['edd','EDD'],
  ['hospitalizations','Previous hospitalizations or surgeries'], ['medications','Current Medications'],
  ['pmhSelections','PMH selections'], ['familyHistoryNone','Family history none'], ['allergyFlags','Allergy selections'], ['immunizationSelections','Immunization selections'], ['vaccineFlu','Influenza vaccine details'], ['vaccinePneumococcal','Pneumococcal vaccine details'],
  ['examHEENT','HEENT findings'], ['examChest','Chest / lung findings'], ['examCV','Cardiovascular findings'], ['examAbdomen','Abdominal findings'], ['examGU','GU / IE findings'], ['examSkin','Skin / extremity findings'],
  ['abdomenAppearance','Abdominal appearance'], ['fundalHeight','Fundal height'], ['fht','FHT'], ['efw','EFW'], ['leopoldL1','Leopold L1'], ['leopoldL2','Leopold L2'], ['leopoldL2MR','Leopold L2 maternal right'], ['leopoldL2ML','Leopold L2 maternal left'], ['leopoldL3','Leopold L3'], ['leopoldL4','Leopold L4'], ['ieSummary','IE summary'], ['bishopDilation','Cervical dilation'], ['bishopEffacement','Cervical effacement'], ['bishopStation','Cervical station'], ['bishopConsistency','Cervical consistency'], ['bishopPosition','Cervical position'], ['admittingDiagnosis','Admitting diagnosis'],
  ['gravidaCount','Gravida count'], ['parityCount','Parity count'], ['termCount','Term count'], ['pretermCount','Preterm count'], ['abortionCount','Abortion count'], ['liveBirthCount','Live birth count'],
  ['vaccineCovid','COVID'], ['vaccineBooster','Booster'], ['vaccineTdap','Tdap'], ['vaccineTt','TT'],
  ['allergies','FOOD AND DRUG ALLERGIES'], ['allergyStatus','ALLERGY STATUS'], ['smoking','Smoker'], ['alcohol','Alcohol'], ['alcoholDetails','Alcohol details'], ['illicitDrugUse','Illicit drug use'],
  ['menstrualIntervalDays','Cycle interval days'], ['menstrualSoak','Flow'], ['mDysmenorrhea','Dysmenorrhea'],
  ['sexualPartnersQty','Partners'], ['sexualPartnersGender','Partner gender'], ['sexualContraceptiveOther','Other contraception'], ['sexualPapFinding','Pap status'], ['sexualStiDetails','STI details'],
  ['vsBp','BP'], ['vsHr','HR'], ['vsRr','RR'], ['vsTemp','TEMP'], ['vsPpw','PPW'], ['vsWt','WT'], ['vsHt','HT'],
];
const pmhOptions = ['None','Pulmonary tuberculosis','Diabetes','Hypertension','Asthma','Heart problem'];
const procedureHistoryOptions = ['Previous admission','Surgery'];
const pregnancyLogColumns=[{key:'year',label:'Year',type:'number'},{key:'gestationalAge',label:'Gestational age',placeholder:'e.g. 24 weeks'},{key:'outcome',label:'Outcome',options:[['','Select'],['Current pregnancy','Current pregnancy'],['Term','Term'],['Preterm','Preterm'],['Complete abortion','Complete abortion'],['Incomplete abortion','Incomplete abortion'],['Ectopic pregnancy','Ectopic pregnancy'],['Stillbirth','Stillbirth'],['Other','Other']]},{key:'mode',label:'Mode / type',options:[['','Select'],['NSVD','NSVD'],['Cesarean section','Cesarean section'],['Vacuum-assisted','Vacuum-assisted'],['Forceps','Forceps'],['Spontaneous complete','Spontaneous complete'],['N/A','N/A'],['Other','Other']]},{key:'sex',label:"Baby's sex",options:[['','Select'],['Female','Female'],['Male','Male'],['N/A','N/A'],['Other','Other']]},{key:'weight',label:'Birth weight (g)',type:'number'},{key:'institution',label:'Institution'},{key:'complications',label:'Complications',placeholder:'None, or describe'}];
const procedureLogColumns=[{key:'age',label:'Age / year',placeholder:'e.g. 7 years old'},{key:'type',label:'Type',options:[['','Select'],['Hospitalization','Hospitalization'],['Surgery','Surgery'],['Procedure','Procedure']]},{key:'institution',label:'Hospital / institution',placeholder:'Optional'},{key:'details',label:'Reason / details'}];
const prenatalLogColumns=[{key:'timing',label:'AOG / date / timing',placeholder:'e.g. 17 weeks AOG'},{key:'details',label:'Visit details',multiline:true,placeholder:'Findings, tests, treatment, and follow-up'}];
const pediaPmhOptions = pmhOptions;
const entPmhOptions = ['None','Hypertension','Diabetes','Bronchial Asthma','Cancer'];
const familyLabels = ['Hypertension','Diabetes','Asthma','Coronary artery disease','Cancer','PCOS','Mental disorders','Congenital anomalies','Twinning'];
const obFields = obTextFields.concat(familyLabels.map(label=>[`family_${label}`,label]),[['family_CancerDetail','Cancer type / details']]);
const obFamilyOrder = [['Hypertension','Hypertension'],['Diabetes','Diabetes'],['Asthma','Asthma'],['Coronary artery disease','Coronary artery disease'],['Cancer','Cancer'],['PCOS','PCOS'],['Mental disorders','Mental disorders'],['Congenital anomalies','Congenital anomalies'],['Twinning','Twinning']];
const relationOptions = [['','Select'],['None','None'],['Maternal','Maternal'],['Paternal','Paternal'],['Both','Both']];
const examGroups = [
  ['HEENT',['Essentially normal','Icteric sclerae','Abnormal pupil reaction','Pale conjunctivae','Lymphadenopathy','Sunken eyeballs','Dry mucous membrane','Sunken fontanelle']],
  ['Chest / lungs',['Essentially normal','Lump over breast','Asymmetric chest expansion','Rales / crackles / rhonchi','Decreased breath sounds','Retractions','Wheezes']],
  ['Cardiovascular',['Essentially normal','Irregular rhythm','Displaced apex beat','Muffled heart sounds','Heaves / thrills','Murmur','Pericardial bulge']],
  ['Abdomen',['Essentially normal','Palpable mass','Abdominal rigidity','Tympanitic / dull','Abdominal tenderness','Uterine contractions','Hyperactive bowel sounds']],
  ['GU / IE',['Essentially normal','Blood on examining finger','Cervical dilation','Uterine discharge']],
  ['Skin / extremities',['Essentially normal','Edema / swelling','Rashes / petechiae','Clubbing','Decreased mobility','Weak pulse','Cold clammy skin','Pale nailbeds','Cyanosis / mottled skin','Poor skin turgor']],
];
const pediaFamily = [['familyHtn','Hypertension'],['familyDm','Diabetes'],['familyAsthma','Asthma'],['familyCad','Coronary artery disease'],['familyCancer','Cancer'],['familyPcos','PCOS'],['familyMental','Mental disorders'],['familyCongenital','Congenital anomalies'],['familyTwins','Twinning']];
const pediaFields = [
  ['dateLine','DATE'],['bed','LRDR BED'],['motherName',"Mother's name"],['address','Address'],['civilStatus','Civil Status'],['age','Age'],
  ['ob','OB'],['pedia','Pedia'],['gender',"Baby's Gender"],['obScore','OB score'],
  ['lmp','LMP'],['aogLmp','AOG by LMP'],['aogUtz','AOG by UTZ'],['edd','EDD'],['fh','FH'],['efw','EFW'],['firstPnc','First PNC'],
  ['maternalBt','Mat BT'],['paternalBt','Pat BT'],['hbsag','HbsAg'],['hiv','HIV'],['syphilis','Syphilis'],['papsmear','Papsmear'],
  ['cas','CAS'],['gbs','GBS'],['ogtt','OGTT'],['allergyFood','Allergies · Food'],['allergyMeds','Allergies · Meds'],
  ['allergyFoodStatus','Food allergy status'],['allergyMedsStatus','Medication allergy status'],
  ['prenatalMeds','Prenatal vitamins / meds'],['maternalHtn','Hypertension'],['maternalDiabetes','Diabetes'],['maternalAsthma','Asthma'],['complicationsOther','Other complications'],['prenatalHx','Pertinent Prenatal Hx'],
  ['usDate','Latest Ultrasound date'],['latestUs','Latest Ultrasound details'],['obHx','OB Hx'],['pmh','Past Medical History'],['familyHistoryNone','No known family history'],['immunizationSelections','Immunization selections'],['vaccineFlu','Influenza vaccine details'],['vaccinePneumococcal','Pneumococcal vaccine details'],['allergyFoodFlags','Food allergy selections'],['allergyMedsFlags','Medication allergy selections'],
  ['covidBrand','Covid vaccine brand'],['covidDoses','Covid vaccine doses'],['booster1','Booster 1'],['booster2','Booster 2'],['tdapDoses','Prenat · Tdap doses'],['ttDoses','Prenat · TT doses'],
  ...pediaFamily.map(([key,label])=>[key,label]),['familyCancerDetail','Cancer type / relative'],
  ['pshSmoking','Smoking'],['pshAlcohol','Alcohol'],['pshAlcoholDetails','Alcohol details'],['pshDrugs','Illicit drug use'],['pshAllergies','Food or drug allergies'],['cc','CC'],['hpi','HPI'],['ie','IE'],['lateFh','FH · current'],['lateEfw','EFW · current'],['fht','FHT'],['plan','Plan'],
];const blank = fields => Object.fromEntries(fields.map(([key]) => [key, '']));
const entFields = [['date','Date'],['name','Name'],['age','Age'],['sex','Sex'],['address','Address'],['nationality','Nationality'],['religion','Religion'],['contact','Cellphone number'],['cc','Chief complaint'],['hpi','History of present illness'],['assessment','Assessment'],['pmh','Past medical history'],['immunizationSelections','Immunizations'],['pshSmoking','Smoking'],['pshAlcohol','Alcohol'],['pshDrugs','Illicit drug use'],['allergies','Food / drug allergies'],['maternalFamily','Maternal family history'],['paternalFamily','Paternal family history'],['generalSurvey','General survey'],['eyes','Eyes'],['head','Head'],['ears','Ears'],['nose','Nose'],['mouth','Mouth'],['throatNeck','Throat / neck'],['traumaTimeReceived','Time received'],['hospitalNumber','Hospital number'],['reasonReferral','Reason for referral'],['workingImpression','Working impression'],['noi','Nature of injury'],['toi','Time of injury'],['doi','Date of injury'],['poi','Place of injury'],['injuryNarrative','Injury narrative'],['comorbiditiesNone','No known comorbidities'],['comorbidities','Comorbidities'],['medicationsNone','No maintenance medication'],['maintenanceMeds','Maintenance medications'],['familyDiseasesNone','No known hereditary diseases'],['familyDiseases','Family history details'],['traumaSocialHistory','Personal and social history'],['traumaSurvey','General survey'],['traumaFindings','Trauma physical exam findings']];
const entFamilyFields = [['familyHtn','Hypertension'],['familyDm','Diabetes'],['familyAsthma','Bronchial Asthma'],['familyMalignancy','Malignancy']];
const entExamGroups = [['Eyes','peEyes',['Full EOMs','Subconjunctival hemorrhage','Icteric sclerae','Periorbital swelling']],['Head','peHead',['Normocephalic','Lesions','Swelling','Facial avulsion','Laceration']],['Ears','peEars',['Otalgia','Otorrhea','Otorrhagia','Deformities','Tug test','Tragus test','Impacted cerumen','Hearing loss','Perforated tympanic membrane','Foreign body']],['Nose','peNose',['Patent nares','Epistaxis','Septal deviation','Sinus tenderness','Bloody discharge','Foreign body','Congestion','Abrasions over bridge of nose']],['Mouth','peMouth',['Pink moist lips and oral mucosa','Lesions','Sublingual hematoma','Enlarged submandibular gland']],['Throat/Neck','peThroatNeck',['Trachea at midline','Tenderness','Erythema','Swelling','Palpable neck mass','Left cervical lymphadenopathy','Stridor','Hoarseness','Dysphagia','Odynophagia']]];
const traumaFindings=['Laceration','Subconjunctival haemorrhage','Abrasion','Step-off deformity','Nasal crepitus',"Racoon's eye",'Full EOM','Otorrhagia','Drawer sign','Battle Sign','Sublingual Hematoma','Swelling','Limitation of mouth opening','Tenderness','Malocclusion','Trismus'];
function buildEntTrauma(data, procedureEvents=[], procedureSelections=[]) {
  const traumaDate=(value,padded=false)=>{if(!value)return '';const [year,month,day]=value.split('-');if(!year||!month||!day)return value;return `${padded?month:String(Number(month))}/${padded?day:String(Number(day))}/${year.slice(-2)}`;};
  const clock=value=>{if(!value)return '';const [hourText,minute]=value.split(':');const hour=Number(hourText);if(Number.isNaN(hour))return value;return `${hour%12||12}:${minute||'00'} ${hour>=12?'PM':'AM'}`;};
  const date=traumaDate(data.date);
  const pmhSelections=Array.isArray(data.pmhSelections)?data.pmhSelections:[];
  const pmhRows=[['Hypertension','HTN'],['Diabetes','DM'],['Bronchial Asthma','Bronchial Asthma'],['Cancer','CA']].map(([option,label])=>`(${pmhSelections.includes(option)?'+':'-'}) ${label}`);
  const medications=data.medicationsNone==='yes'?'No maintenance medication':clean(data.maintenanceMeds);
  const medicalText=[`PAST MEDICAL HISTORY:\n${pmhSelections.includes('None')?'No known comorbidities':pmhRows.join('\n')}`,medications?`Current medications: ${medications}`:''].filter(Boolean).join('\n');
  const immunizationItems=(Array.isArray(data.immunizationSelections)?data.immunizationSelections:[]).map(item=>`(+) ${item}`);
  const immunizationText=immunizationItems.length?`IMMUNIZATIONS:\n${immunizationItems.join('\n')}`:'';
  const familyRow=relative=>entFamilyFields.map(([key,label])=>`(${data.familyDiseasesNone==='yes'?'-':data[key]==='Both'||data[key]===relative?'+':'-'}) ${label}`);
  const familyText=`FAMILY HISTORY:\n• Maternal:\n${familyRow('Maternal').join('\n')}\n\n• Paternal:\n${familyRow('Paternal').join('\n')}`;
  const socialText=[['Smoking',data.pshSmoking],['Alcohol',data.pshAlcohol],['Illicit drug use',data.pshDrugs]].filter(([,value])=>value).map(([label,value])=>`(${value==='No'?'-':'+'}) ${label}`).concat(clean(data.allergies)?`(${data.allergies==='None'?'-':'+'}) Food or Drug Allergies${data.allergies!=='None'?`: ${clean(data.allergies)}`:''}`:[]);
  const procedureDetails=procedureEvents.map(row=>[clean(row.age),clean(row.type),clean(row.institution),clean(row.details)].filter(Boolean).join(' — ')).filter(Boolean);
  const procedureText=procedureSelections.length?`PREVIOUS ADMISSIONS OR SURGERIES:\n${procedureDetails.map(item=>`- ${item}`).join('\n')}`:'';
  const examText=traumaFindings.map(item=>data.traumaFindings?.[item]==='+'||data.traumaFindings?.[item]==='-'?`(${data.traumaFindings[item]}) ${item}`:'').filter(Boolean).join('\n');
  const sections=[
    'Good day, doctors!',
    `Respectfully informing that we have a new IDR here at ER-ENT from Trauma${date?` (${date})`:''}`,
    '',
    `Time received: ${clock(data.traumaTimeReceived)}`,
    '',
    `Name: ${clean(data.name)}`,
    `Age/Gender: ${clean(data.age)}${clean(data.age)&&clean(data.sex)?'/':''}${clean(data.sex)}`,
    `Hospital #: ${clean(data.hospitalNumber)}`,
    `Reason for referral: ${clean(data.reasonReferral)}`,
    '',
    `Working Impression: ${clean(data.workingImpression)}`,
    '',
    `NOI: ${clean(data.noi)}`,
    `TOI: ${clock(data.toi)}`,
    `DOI: ${traumaDate(data.doi,true)}`,
    `POI: ${clean(data.poi)}`,
    '',
    clean(data.injuryNarrative),
    '',
    medicalText,
    immunizationText,
    procedureText,
    familyText,
    socialText.length?`PERSONAL AND SOCIAL HISTORY:\n${socialText.join('\n')}`:'',
    '',
    clean(data.traumaSurvey),
    '',
    examText,
    '',
    'Thank you, Doctors!',
  ].filter((line,index,array)=>line!==''||index===0||array[index-1]!=='' ).join('\n');
  return uppercaseOutputLabels(sections);
}
function StatusChecklist({items,selected={},onChange}) { return <div className="ent-checklist">{items.map(item=><div className="ent-finding" key={item}><span>{item}</span><label><input type="checkbox" checked={selected[item]==='+'} onChange={e=>onChange({...selected,[item]:e.target.checked?'+':''})}/> Positive</label><label><input type="checkbox" checked={selected[item]==='-'} onChange={e=>onChange({...selected,[item]:e.target.checked?'-':''})}/> Negative</label></div>)}</div>; }
function buildEnt(data, procedureEvents=[], procedureSelections=[]) {
  if(data.entFormat==='trauma') return buildEntTrauma(data,procedureEvents,procedureSelections);
  const name=clean(data.name);
  const patientLines=[`Name: ${name}`,`Age& Sex: ${clean(data.age)}${clean(data.age)&&clean(data.sex)?'/':''}${clean(data.sex)}`,`Address: ${clean(data.address)}`,...(data.entFormat==='blotter'?[`Nationality: ${clean(data.nationality)}`]:[]),`Religion: ${clean(data.religion)}`,`Cellphone#: ${clean(data.contact)}`];
  if(data.entFormat==='blotter') return uppercaseOutputLabels([formatDate(data.date,true),'Good day, Doctors!','','We have a new blotter patient in the ER:','',...patientLines,'',`CC: ${clean(data.cc)}`,'','Hx and PE to follow.','','Thank you, Doctors!'].join('\n'));
  const entPmh=Array.isArray(data.pmhSelections)?data.pmhSelections:[];
  const entPmhOutput=[['Hypertension','HTN'],['Diabetes','DM'],['Bronchial Asthma','Bronchial Asthma'],['Cancer','CA']].map(([option,label])=>`(${entPmh.includes(option)?'+':'-'}) ${label}`).concat(`(${procedureSelections.includes('Previous admission')?'+' : '-'}) Prior Hospitalization`);
  const entImmunizations=(Array.isArray(data.immunizationSelections)?data.immunizationSelections:[]).map(item=>`(+) ${item}`);
  const procedureDetails=procedureEvents.map(row=>[clean(row.age),clean(row.type),clean(row.institution),clean(row.details)].filter(Boolean).join(' — ')).filter(Boolean);
  const familyRows=relative=>entFamilyFields.map(([key,label])=>`(${data[key]==='Both'||data[key]===relative?'+':'-'}) ${label}`);
  const examRows=entExamGroups.map(([label,key])=>{const findings=Object.entries(data[key]||{}).filter(([,status])=>status==='+'||status==='-').map(([finding,status])=>`(${status}) ${finding}`);return findings.length?`${label}:\n${findings.join('\n')}`:''}).filter(Boolean);
  return uppercaseOutputLabels(['Good day, Doctors!','', 'Respectfully informing you of the new blotter patient to ER-ENT:','', 'GENERAL DATA','',...patientLines,'',`Chief Complaint: ${clean(data.cc)}`,'',`HPI:\n${clean(data.hpi)}`,'',`Assessment:\n${clean(data.assessment)}`,'',`PMH:\n${[...entPmhOutput,...entImmunizations].join('\n')}`,(procedureSelections.some(item=>item==='Surgery')||procedureDetails.length)?`PREVIOUS HOSPITALIZATIONS OR SURGERIES:\n${[...procedureSelections.filter(item=>item==='Surgery'),...procedureDetails.map(item=>`- ${item}`)].join('\n')}`:'',`PSH:\n${clean(data.pshSmoking) ? `(${data.pshSmoking==='No'?'-':'+'}) Smoking` : ''}${clean(data.pshAlcohol) ? `\n(${data.pshAlcohol==='No'?'-':'+'}) Alcohol` : ''}${clean(data.pshDrugs) ? `\n(${data.pshDrugs==='No'?'-':'+'}) Illicit drug use` : ''}${clean(data.allergies) ? `\n(${data.allergies==='None'?'-':'+'}) Food or Drug Allergies` : ''}`,'',`Family History:\n• Maternal:\n${familyRows('Maternal').join('\n')}\n\n• Paternal:\n${familyRows('Paternal').join('\n')}`,'',`PE:\nGeneral Survey: ${clean(data.generalSurvey)}`,...examRows,'','Thank you, Doctors!'].join('\n'));
}


function uppercaseOutputLabels(text) {
  const fixedStarts=['Good day, Doctors!','We have a new blotter patient in the ER:','Respectfully sending to you the details of the mother at LRDR Bed #','Respectfully informing you of the new blotter patient to ER-ENT:','Hx and PE to follow.','Thank you, doctors!','Thank you, Doctors!'];
  const fixedLines=new Set(['PD','GENERAL DATA','— OB HISTORY —','— MENSTRUAL HISTORY —','— SEXUAL HISTORY —','Previous Hospitalizations or Surgeries','Current Medications']);
  const labels=new Set(["Name",'Age& Sex','Address','Nationality','Religion','Cellphone#','CC','Chief Complaint','HPI','Assessment','PMH','PSH','Family History','PE','General Survey',"Mother's name",'Civil Status','Age','OB','Pedia',"Baby's Gender",'OB score','LMP','AOG by LMP','AOG by UTZ','EDD','FH','EFW','First PNC','Mat BT','Pat BT','HbsAg','HIV','Syphilis','Papsmear','CAS','GBS','OGTT','Allergies','Prenatal vitamins/meds','Maternal Illness/Complications','Hypertension','Diabetes','Asthma','Pertinent Prenatal Hx','Latest Ultrasound','OB Hx','Past Medical History','Previous Hospitalizations or Surgeries','Vaccines','Family Medical Hx','Personal/Social History','IE','FHT','Plan','M','I','D','A','C','P','S','OBS','Smoker','Alcoholic beverage drinker','FOOD AND DRUG ALLERGIES','VITAL SIGNS','CURRENT MEDICATIONS','GUT','IE SUMMARY','BP','HR','RR','TEMP','PPW','WT','HT','HEENT','Chest / lungs','Cardiovascular','Abdomen','GU / IE','Skin / extremities','Eyes','Head','Ears','Nose','Mouth','Throat/Neck']);
  return text.split('\n').map(line=>{
    if(fixedLines.has(line))return line.toUpperCase();
    if(fixedStarts.some(prefix=>line.startsWith(prefix)))return line.toUpperCase();
    const colon=line.indexOf(':');
    if(colon>=0&&labels.has(line.slice(0,colon)))return `${line.slice(0,colon+1).toUpperCase()}${line.slice(colon+1)}`;
    return line;
  }).join('\n');
}

function clean(value='') { return String(value).trim(); }
const bishopOptions={
  dilation:[['','Select'],['Closed','Closed'],['1 cm','1 cm'],['2 cm','2 cm'],['3 cm','3 cm'],['4 cm','4 cm'],['≥5 cm','≥5 cm']],
  effacement:[['','Select'],['SE / 0-30%','SE / 0-30%'],['40-50%','40-50%'],['60-70%','60-70%'],['≥80%','≥80%']],
  station:[['','Select'],['-3 / Floating','-3 / Floating'],['-2','-2'],['-1','-1'],['0','0'],['+1','+1'],['+2','+2'],['+3 / Engaged','+3 / Engaged']],
  consistency:[['','Select'],['Firm','Firm'],['Medium','Medium'],['Soft','Soft']],
  position:[['','Select'],['Posterior','Posterior'],['Midposition','Midposition'],['Anterior','Anterior']],
};
const bishopPoints={dilation:{Closed:0,'1 cm':1,'2 cm':1,'3 cm':2,'4 cm':2,'≥5 cm':3},effacement:{'SE / 0-30%':0,'40-50%':1,'60-70%':2,'≥80%':3},station:{'-3 / Floating':0,'-2':1,'-1':2,'0':2,'+1':3,'+2':3,'+3 / Engaged':3},consistency:{Firm:0,Medium:1,Soft:2},position:{Posterior:0,Midposition:1,Anterior:2}};
function calculateBishopScore(data) {
  const keys=['dilation','effacement','station','consistency','position'];
  if(!keys.every(key=>data[`bishop${key[0].toUpperCase()}${key.slice(1)}`])) return null;
  return keys.reduce((total,key)=>total+bishopPoints[key][data[`bishop${key[0].toUpperCase()}${key.slice(1)}`]],0);
}
function formatDate(value, short=false) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  if (short) return date.toLocaleDateString('en-US',{month:'short',day:'numeric'}).replace(/^Sep /,'Sept ');
  return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}
function formatYear(value) { return value ? String(value).slice(0,4) : ''; }
function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = `${date.getMonth()+1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
  return `${day} ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`;
}
function labeled(label, value) { return `${label}: ${clean(value)}`; }
function titled(title, fields) { return `${title}\n${fields.map(([label,value])=>labeled(label,value)).join('\n')}`; }
let nextRowId = 0;
function makePregnancy() { return {id:++nextRowId,year:'',gestationalAge:'',outcome:'',mode:'',sex:'',weight:'',institution:'',complications:''}; }
function makePrenatalVisit() { return {id:++nextRowId,timing:'',details:''}; }
function makeProcedureEvent() { return {id:++nextRowId,age:'',type:'',institution:'',details:''}; }
function reserveSavedRowIds(draft) {
  const rowLists = ['obstetricHistory','prenatalVisits','procedureEvents','entProcedureEvents',
    'pediaProcedureEvents','pediaPrenatalVisits','pediaObstetricHistory'];
  const savedIds = rowLists.flatMap(key => Array.isArray(draft[key]) ? draft[key].map(row => Number(row?.id) || 0) : []);
  nextRowId = Math.max(nextRowId, ...savedIds);
}
function moveRow(setRows,index,direction) {
  setRows(rows=>{const target=index+direction;if(target<0||target>=rows.length)return rows;const copy=[...rows];[copy[index],copy[target]]=[copy[target],copy[index]];return copy;});
}
function formatPregnancyRows(rows) {
  return rows.map((row,index)=>{
    const gravida=`G${index+1}`;
    if(row.outcome==='Current pregnancy')return `${gravida}: current pregnancy`;
    const detail=[clean(row.year),clean(row.gestationalAge),clean(row.outcome),clean(row.mode),clean(row.sex),clean(row.weight)&&`${clean(row.weight)} g`,clean(row.institution)].filter(Boolean).join(', ');
    const complications=clean(row.complications);
    return detail||complications?`${gravida}: ${[detail,complications&&`Complications: ${complications}`].filter(Boolean).join('; ')}`:'';
  }).filter(Boolean).join('\n');
}
function formatPrenatalRows(rows) {
  return rows.map(row=>{
    const timing=clean(row.timing),details=clean(row.details);
    if(!timing&&!details)return '';
    return `AT ${timing}${timing&&details?', ':''}${details}`;
  }).filter(Boolean).join('\n\n');
}

function buildOb(data, obstetricHistory, prenatalVisits, procedureEvents, procedureSelections=[]) {
  const parts = [];
  parts.push(obTextFields.slice(0,8).map(([key,label])=>labeled(label,data[key])).join('\n'));
  const ccDateTime = formatDateTime(data.ccDateTime);
  parts.push(labeled('CC',[clean(data.cc),ccDateTime?`(${ccDateTime})`:'' ].filter(Boolean).join(' ')));
  parts.push(`HPI:\n${clean(data.hpi)}`);
  const amount = [clean(data.menstrualAmount) && `${clean(data.menstrualAmount)} pads per day`, clean(data.menstrualSoak)].filter(Boolean).join(', ');
  const interval = `${clean(data.menstrualI)}${clean(data.menstrualIntervalDays) ? ` (${clean(data.menstrualIntervalDays)} days)` : ''}`.trim();
  const symptoms = [data.mDysmenorrhea === 'yes' ? 'Dysmenorrhea' : '', clean(data.menstrualAssociated)].filter(Boolean).join(', ');
  parts.push(titled('MENSTRUAL HISTORY', [['M',data.menstrualM],['I',interval],['D',data.menstrualD],['A',amount],['A',symptoms]]));
  const partners = [clean(data.sexualPartnersQty), clean(data.sexualPartnersGender)].filter(Boolean).join(', ');
  const contraception = data.sexualC2 === 'Other' ? clean(data.sexualContraceptiveOther) : clean(data.sexualC2);
  const pap = [formatYear(data.sexualP2), data.sexualPapFinding && data.sexualPapFinding !== 'Not stated' ? clean(data.sexualPapFinding) : ''].filter(Boolean).join(', ');
  const sti = data.sexualS === 'History' ? `History - ${clean(data.sexualStiDetails)}` : clean(data.sexualS);
  parts.push(titled('SEXUAL HISTORY', [['C',data.sexualC1],['P',partners],['C',contraception],['P',pap],['S',sti]]));
  const gravParity = clean(data.gravidaCount)||clean(data.parityCount);
  const tpalValues = [data.termCount,data.pretermCount,data.abortionCount,data.liveBirthCount];
  const obsSummary = gravParity ? `G${clean(data.gravidaCount)||'0'}P${clean(data.parityCount)||'0'}${tpalValues.some(clean)?` (${tpalValues.map(value=>clean(value)||'0').join('')})`:''}` : data.obs;
  parts.push(titled('OB HISTORY', [['OBS',obsSummary],['LMP',formatDate(data.lmp)],['PMP',formatDate(data.pmp)],['EDD',formatDate(data.edd)]]));
  parts.push(`OBSTETRICAL HISTORY\n${formatPregnancyRows(obstetricHistory)}`);
  parts.push(`PRENATAL HISTORY\n${formatPrenatalRows(prenatalVisits)}`);
  const pmh = Array.isArray(data.pmhSelections) ? data.pmhSelections : [];
  const pmhOutput = pmh.includes('None')?'None':pmh.join(', ')||'Not specified';
  parts.push(`Past Medical History:\n${pmhOutput}`);
  const procedureDetails = procedureEvents.map(row=>[clean(row.age),clean(row.type),clean(row.institution),clean(row.details)].filter(Boolean).join(' — ')).filter(Boolean);
  if (procedureSelections.length||procedureDetails.length) parts.push(`PREVIOUS HOSPITALIZATIONS OR SURGERIES:\n${[...procedureSelections,...procedureDetails.map(item=>`- ${item}`)].join('\n')}`);
  parts.push(`Current Medications\n${clean(data.medications)}`);
  const vaccineRows=[['COVID',data.vaccineCovid],['Influenza',data.vaccineFlu],['Pneumococcal',data.vaccinePneumococcal],['Tetanus / TT',data.vaccineTt],['Tdap',data.vaccineTdap],['Booster',data.vaccineBooster]].filter(([label,detail])=>(Array.isArray(data.immunizationSelections)&&data.immunizationSelections.includes(label))||clean(detail));
  if(vaccineRows.length)parts.push(`VACCINES RECEIVED\n${vaccineRows.map(([label,detail])=>`${label}: ${clean(detail)}`).join('\n')}`);
  const allergyFlags=Array.isArray(data.allergyFlags)?data.allergyFlags:[];
  const allergyOutput=allergyFlags.includes('No known allergies')?'None':allergyFlags.includes('Known allergy')?(clean(data.allergies)||'Known allergies'):data.allergyStatus==='None'?'None':data.allergyStatus==='Unknown'?'Unknown':data.allergies;
  const personalSocialRows=[allergyOutput?labeled('FOOD AND DRUG ALLERGIES',allergyOutput):''].filter(Boolean);
  const obSocialRows=[clean(data.smoking)?`(${data.smoking==='No'?'-':'+'}) Smoking`:'',clean(data.alcohol)?`(${data.alcohol==='No'?'-':'+'}) Alcohol${clean(data.alcoholDetails)?` — ${clean(data.alcoholDetails)}`:''}`:'',clean(data.illicitDrugUse)?`(${data.illicitDrugUse==='No'?'-':'+'}) Illicit drug use`:''].filter(Boolean);
  parts.push(`PERSONAL AND SOCIAL HISTORY\n${[...personalSocialRows,...obSocialRows].join('\n')}`);
  const familyMedicalRows=obFamilyOrder.map(([key,label])=>{const relation=data[`family_${key}`];if(data.familyHistoryNone==='yes'||relation==='None')return `(-) ${label.toUpperCase()}`;if(!relation)return '';const detail=key==='Cancer'?clean(data.family_CancerDetail):'';return `(+) ${label.toUpperCase()} - ${[detail,relation].filter(Boolean).join(', ')}`;}).filter(Boolean);
  parts.push(`Family Medical Hx:\n${familyMedicalRows.join('\n')}`);
  const examKeyByTitle = {'HEENT':'examHEENT','Chest / lungs':'examChest','Cardiovascular':'examCV','Abdomen':'examAbdomen','GU / IE':'examGU','Skin / extremities':'examSkin'};
  const examLines = examGroups.map(([title])=>{const selected=data[examKeyByTitle[title]];return Array.isArray(selected)&&selected.length?`${title}: ${selected.join(', ')}`:'';}).filter(Boolean);
  if (examLines.length) parts.push(`PHYSICAL EXAMINATION\n${examLines.join('\n')}`);
  const abdominalDetails = [clean(data.abdomenAppearance),clean(data.fundalHeight)&&`FH ${clean(data.fundalHeight)} cm`,clean(data.fht)&&`FHT ${clean(data.fht)}`,clean(data.efw)&&`EFW ${clean(data.efw)} g`].filter(Boolean);
  const l2Details=[data.leopoldL2MR&&`MR - ${clean(data.leopoldL2MR)}`,data.leopoldL2ML&&`ML - ${clean(data.leopoldL2ML)}`].filter(Boolean).join('; ')||clean(data.leopoldL2);
  const leopoldDetails = [['L1',data.leopoldL1],['L2',l2Details],['L3',data.leopoldL3],['L4',data.leopoldL4]].filter(([,value])=>clean(value)).map(([label,value])=>`${label}: ${clean(value)}`);
  if (abdominalDetails.length) parts.push(`ABDOMINAL EXAM\n${abdominalDetails.join(', ')}`);
  if (leopoldDetails.length) parts.push(`LEOPOLD MANEUVERS\n${leopoldDetails.join('\n')}`);
  const bishopScore=calculateBishopScore(data);
  const ieDetails=[data.bishopDilation&&`Dilation: ${data.bishopDilation}`,data.bishopEffacement&&`Effacement: ${data.bishopEffacement}`,data.bishopStation&&`Station: ${data.bishopStation}`,data.bishopConsistency&&`Consistency: ${data.bishopConsistency}`,data.bishopPosition&&`Position: ${data.bishopPosition}`,bishopScore!==null&&`Bishop score: ${bishopScore}/13`].filter(Boolean);
  if (ieDetails.length) parts.push(labeled('IE SUMMARY',ieDetails.join('; ')));
  else if (clean(data.ieSummary)) parts.push(labeled('IE SUMMARY',data.ieSummary));
  if (clean(data.admittingDiagnosis)) parts.push(`ADMITTING DIAGNOSIS\n${clean(data.admittingDiagnosis)}`);
  parts.push(titled('VITAL SIGNS', [['BP',data.vsBp],['HR',data.vsHr],['RR',data.vsRr],['TEMP',data.vsTemp],['PPW',data.vsPpw],['WT',data.vsWt],['HT',data.vsHt]]));
  return uppercaseOutputLabels(parts.join('\n\n').trim());
}

function buildPedia(data, procedureEvents=[], prenatalVisits=[], procedureSelections=[], obstetricHistory=[]) {
  const pediaPmh=Array.isArray(data.pmh)?data.pmh:[];
  const pmhOutput=pediaPmh.includes('None')?'None':pediaPmh.join(', ')||'Not specified';
  const vaccineSelections=Array.isArray(data.immunizationSelections)?data.immunizationSelections:[];
  const vaccineLines=[];
  if(data.covidBrand||clean(data.covidDoses)||vaccineSelections.includes('COVID'))vaccineLines.push(`COVID VACCINE ${data.covidBrand?`${data.covidBrand} x${clean(data.covidDoses)||'1'} dose`:'received'}`);
  const boosters=[data.booster1,data.booster2].filter(Boolean);
  if(boosters.length||vaccineSelections.includes('Booster'))vaccineLines.push(`BOOSTER ${boosters.length?`x${boosters.length} dose- ${boosters.join(' and ')}`:'received'}`);
  if(data.vaccineFlu||vaccineSelections.includes('Influenza'))vaccineLines.push(`INFLUENZA ${clean(data.vaccineFlu)||'received'}`);
  if(data.vaccinePneumococcal||vaccineSelections.includes('Pneumococcal'))vaccineLines.push(`PNEUMOCOCCAL ${clean(data.vaccinePneumococcal)||'received'}`);
  const prenatalVaccines=[];
  if(data.tdapDoses||vaccineSelections.includes('Tdap'))prenatalVaccines.push(`TDAP ${data.tdapDoses?`x${clean(data.tdapDoses)} dose`:'received'}`);
  if(data.ttDoses||vaccineSelections.includes('Tetanus / TT'))prenatalVaccines.push(`TT ${data.ttDoses?`x${clean(data.ttDoses)} dose`:'received'}`);
  if(prenatalVaccines.length)vaccineLines.push(`PRENAT: ${prenatalVaccines.join('; ')}`);
  const familyHistoryText=pediaFamily.map(([key,label])=>{
    const relation=data[key];
    if(data.familyHistoryNone==='yes'||relation==='None')return `(-) ${label.toUpperCase()}`;
    if(!relation)return '';
    const detail=key==='familyCancer'?clean(data.familyCancerDetail):'';
    return `(+) ${label.toUpperCase()} - ${detail?`${detail}, `:''}${relation==='Both'?'Both':relation}`;
  }).filter(Boolean).join('\n');
  const foodFlags=Array.isArray(data.allergyFoodFlags)?data.allergyFoodFlags:[];
  const medsFlags=Array.isArray(data.allergyMedsFlags)?data.allergyMedsFlags:[];
  const foodAllergy=foodFlags.includes('No known allergies')?'None':foodFlags.includes('Unknown')?'Unknown':foodFlags.includes('Known allergy')?(clean(data.allergyFood)||'Known allergy'):clean(data.allergyFood);
  const medsAllergy=medsFlags.includes('No known allergies')?'None':medsFlags.includes('Unknown')?'Unknown':medsFlags.includes('Known allergy')?(clean(data.allergyMeds)||'Known allergy'):clean(data.allergyMeds);
  const pediaSocialRows=[
    clean(data.pshSmoking)?`(${data.pshSmoking==='No'?'-':'+'}) Smoking`:'',
    clean(data.pshAlcohol)?`(${data.pshAlcohol==='No'?'-':'+'}) Alcohol${clean(data.pshAlcoholDetails)?` — ${clean(data.pshAlcoholDetails)}`:''}`:'',
    clean(data.pshDrugs)?`(${data.pshDrugs==='No'?'-':'+'}) Illicit drug use`:'',
    clean(data.pshAllergies)?`Food or drug allergies: ${clean(data.pshAllergies)}`:'',
  ].filter(Boolean);
  const intro = [
    formatDate(data.dateLine,true),
    'Good day, Doctors!',
    '',
    `Respectfully sending to you the details of the mother at LRDR Bed #${clean(data.bed)}`,
    '',
    'PD',
    labeled("Mother's name",data.motherName),
    labeled('Address',data.address),
    labeled('Civil Status',data.civilStatus),
    `Age: ${clean(data.age)}${clean(data.age)?' years old':''}`,
    labeled('OB',data.ob),
    labeled('Pedia',data.pedia),
    labeled("Baby's Gender",data.gender),
  ].join('\n');
  const details = [
    titled('', [['OB score',data.obScore],['LMP',formatDate(data.lmp)],['AOG by LMP',data.aogLmp],['AOG by UTZ',data.aogUtz],['EDD',formatDate(data.edd)],['FH',data.fh],['EFW',data.efw],['First PNC',data.firstPnc],['Mat BT',data.maternalBt],['Pat BT',data.paternalBt],['HbsAg',data.hbsag],['HIV',data.hiv],['Syphilis',data.syphilis],['Papsmear',data.papsmear],['CAS',data.cas],['GBS',data.gbs],['OGTT',data.ogtt]]).replace(/^\n/, ''),
    `Prenatal vitamins/meds:\n${clean(data.prenatalMeds)}`,
    `Maternal Illness/Complications:\nHypertension: ${data.maternalHtn||'Not specified'}\nDiabetes: ${data.maternalDiabetes||'Not specified'}\nAsthma: ${data.maternalAsthma||'Not specified'}${clean(data.complicationsOther)?`\n${clean(data.complicationsOther)}`:''}`,
    `Pertinent Prenatal Hx:\n${formatPrenatalRows(prenatalVisits)}`,
    `Latest Ultrasound: ${formatDate(data.usDate)}\n${clean(data.latestUs)}`,
    `OB Hx:\n${formatPregnancyRows(obstetricHistory)}`,
    `Past Medical History:\n${pmhOutput}`,
    (procedureSelections.length||procedureEvents.some(row=>[row.age,row.type,row.institution,row.details].some(clean)))?`PREVIOUS HOSPITALIZATIONS OR SURGERIES:\n${[...procedureSelections,...procedureEvents.map(row=>[clean(row.age),clean(row.type),clean(row.institution),clean(row.details)].filter(Boolean).join(' — ')).filter(Boolean).map(item=>`- ${item}`)].join('\n')}`:'',
    vaccineLines.length?`Vaccines:\n${vaccineLines.join('\n')}`:'',
    `Family Medical Hx:\n${familyHistoryText}`,
    `Personal/Social History:\n${pediaSocialRows.join('\n')}`,
    `CC: ${clean(data.cc)}`,
    `HPI:\n${clean(data.hpi)}`,
    labeled('IE',data.ie),
    labeled('FH',data.lateFh),
    labeled('EFW',data.lateEfw),
    labeled('FHT',data.fht),
    labeled('Plan',data.plan),
    'Thank you, doctors!',
  ];
  return uppercaseOutputLabels([intro,...details].join('\n\n').trim());
}

function Field({ label, value, onChange, multiline=false, hint='', placeholder='', type='text', options=null }) {
  const props = { value, onChange:e=>onChange(e.target.value), placeholder, 'aria-label':label, type };
  return <label className={`field ${multiline?'wide':''}`}><span>{label}</span>{multiline?<textarea {...props} rows={label==='HPI'?5:3}/>:options?<select {...props}>{options.map(([option,labelText])=><option key={option} value={option}>{labelText}</option>)}</select>:<input {...props}/ >}{hint&&<small>{hint}</small>}</label>;
}
function Toggle({label,checked,onChange}) { return <label className="toggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked?'yes':'')}/><span className="toggle-box"/><span>{label}</span></label>; }
function CheckGroup({options,selected,onChange,exclusive=[]}) {
  const values=Array.isArray(selected)?selected:[];
  return <div className="check-grid">{options.map(option=><label className="toggle check-option" key={option}><input type="checkbox" checked={values.includes(option)} onChange={e=>{let next;if(e.target.checked)next=exclusive.includes(option)?[option]:[...values.filter(value=>!exclusive.includes(value)),option];else next=values.filter(value=>value!==option);onChange(next);}}/><span className="toggle-box"/><span>{option}</span></label>)}</div>;
}
function FamilyRow({label,value,onChange}) {
  const hasPaternal=value==='Paternal'||value==='Both';
  const hasMaternal=value==='Maternal'||value==='Both';
  return <div className="family-checkbox-row"><strong>{label}</strong><Toggle label="Paternal" checked={hasPaternal} onChange={checked=>onChange(checked?(hasMaternal?'Both':'Paternal'):(hasMaternal?'Maternal':''))}/><Toggle label="Maternal" checked={hasMaternal} onChange={checked=>onChange(checked?(hasPaternal?'Both':'Maternal'):(hasPaternal?'Paternal':''))}/></div>;
}
function Section({ title, description, children }) { return <section className="form-section"><div className="section-title"><h2>{title}</h2>{description&&<p>{description}</p>}</div><div className="fields">{children}</div></section>; }
function EditableLogTable({title,description,rows,setRows,createRow,columns,rowLabel,addLabel,kind='events'}) {
  const changeCell=(id,key,value)=>setRows(items=>items.map(item=>item.id===id?{...item,[key]:value}:item));
  return <div className={`editable-log editable-log-${kind}`}><div className="editable-log-header"><div><h3>{title}</h3>{description&&<p>{description}</p>}</div><button type="button" onClick={()=>setRows(items=>[...items,createRow()])}>＋ {addLabel}</button></div><div className="editable-log-scroll"><table><thead><tr><th>{rowLabel}</th>{columns.map(column=><th key={column.key}>{column.label}</th>)}<th>Action</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}><th scope="row">{rowLabel==='G'?`G${index+1}`:index+1}</th>{columns.map(column=><td key={column.key}>{column.options?<select aria-label={`${rowLabel==='G'?`G${index+1}`:`Event ${index+1}`} ${column.label}`} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}>{column.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:column.multiline?<textarea aria-label={`${rowLabel==='G'?`G${index+1}`:`Visit ${index+1}`} ${column.label}`} rows={2} placeholder={column.placeholder||''} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}/>:<input aria-label={`${rowLabel==='G'?`G${index+1}`:`Event ${index+1}`} ${column.label}`} type={column.type||'text'} placeholder={column.placeholder||''} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}/>}</td>)}<td className="editable-log-action"><button type="button" aria-label={`Remove ${rowLabel==='G'?`pregnancy G${index+1}`:`event ${index+1}`}`} title="Remove row" onClick={()=>setRows(items=>items.filter(item=>item.id!==row.id))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 3v7m4-7v7"/></svg></button></td></tr>)}</tbody></table></div></div>;
}

export default function App() {
  const [savedDraft] = useState(() => {
    const draft = readLocalDraft();
    reserveSavedRowIds(draft);
    return draft;
  });
  const [tab,setTab] = useState(()=>savedDraft.tab || 'ob');
  const [ob,setOb] = useState(()=>({...blank(obFields),...(savedDraft.ob || {})}));
  const [obstetricHistory,setObstetricHistory] = useState(()=>savedDraft.obstetricHistory || [makePregnancy()]);
  const [prenatalVisits,setPrenatalVisits] = useState(()=>savedDraft.prenatalVisits || [makePrenatalVisit()]);
  const [procedureEvents,setProcedureEvents] = useState(()=>savedDraft.procedureEvents || [makeProcedureEvent()]);
  const [obProcedureSelections,setObProcedureSelections] = useState(()=>savedDraft.obProcedureSelections || []);
  const [entProcedureEvents,setEntProcedureEvents] = useState(()=>savedDraft.entProcedureEvents || [makeProcedureEvent()]);
  const [entProcedureSelections,setEntProcedureSelections] = useState(()=>savedDraft.entProcedureSelections || []);
  const [pediaProcedureEvents,setPediaProcedureEvents] = useState(()=>savedDraft.pediaProcedureEvents || [makeProcedureEvent()]);
  const [pediaProcedureSelections,setPediaProcedureSelections] = useState(()=>savedDraft.pediaProcedureSelections || []);
  const [pediaPrenatalVisits,setPediaPrenatalVisits] = useState(()=>savedDraft.pediaPrenatalVisits || [makePrenatalVisit()]);
  const [pediaObstetricHistory,setPediaObstetricHistory] = useState(()=>savedDraft.pediaObstetricHistory || [makePregnancy()]);
  const [ent,setEnt] = useState(()=>({...blank(entFields),entFormat:'blotter',...(savedDraft.ent || {})}));
  const [pedia,setPedia] = useState(()=>({...blank(pediaFields),...(savedDraft.pedia || {})}));
  const [copied,setCopied] = useState(false);
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        tab, ob, obstetricHistory, prenatalVisits, procedureEvents, obProcedureSelections,
        entProcedureEvents, entProcedureSelections, pediaProcedureEvents, pediaProcedureSelections,
        pediaPrenatalVisits, pediaObstetricHistory, ent, pedia
      }));
    } catch {
      // The form remains usable if browser storage is unavailable or full.
    }
  }, [tab, ob, obstetricHistory, prenatalVisits, procedureEvents, obProcedureSelections,
    entProcedureEvents, entProcedureSelections, pediaProcedureEvents, pediaProcedureSelections,
    pediaPrenatalVisits, pediaObstetricHistory, ent, pedia]);
  const data = tab==='ob'?ob:tab==='pedia'?pedia:ent;
  const setData = tab==='ob'?setOb:tab==='pedia'?setPedia:setEnt;
  const output = useMemo(()=>tab==='ob'?buildOb(ob,obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections):tab==='pedia'?buildPedia(pedia,pediaProcedureEvents,pediaPrenatalVisits,pediaProcedureSelections,pediaObstetricHistory):buildEnt(ent,entProcedureEvents,entProcedureSelections),[tab,ob,obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections,entProcedureEvents,entProcedureSelections,pedia,pediaProcedureEvents,pediaPrenatalVisits,pediaProcedureSelections,pediaObstetricHistory,ent]);
  function update(key,value) { setData(current=>({...current,[key]:value})); setCopied(false); }
  function updateRow(setRows,id,key,value) { setRows(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row)); setCopied(false); }
  async function copyOutput() {
    try { await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(()=>setCopied(false),1800); }
    catch { const area=document.querySelector('.preview-output'); area?.focus(); area?.select(); }
  }
  function clearForm() { if(window.confirm('Clear all fields in this form?')) { setData(blank(tab==='ob'?obFields:tab==='pedia'?pediaFields:entFields)); if(tab==='ob'){setObstetricHistory([makePregnancy()]);setPrenatalVisits([makePrenatalVisit()]);setProcedureEvents([makeProcedureEvent()]);setObProcedureSelections([]);}else if(tab==='pedia'){setPediaProcedureEvents([makeProcedureEvent()]);setPediaProcedureSelections([]);setPediaPrenatalVisits([makePrenatalVisit()]);setPediaObstetricHistory([makePregnancy()]);}else {setEnt({...blank(entFields),entFormat:'blotter',pmhSelections:[]});setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);} setCopied(false); } }
  function loadSample() {
    if(tab==='ent'&&ent.entFormat==='trauma') { setEnt({...blank(entFields),entFormat:'trauma',date:'2026-10-03',traumaTimeReceived:'22:32',name:'Papilitan, Helton Lucero',age:'46',sex:'M',hospitalNumber:'2016933619',reasonReferral:'Evaluation and management',workingImpression:'Multiple Physical Injuries 2* to Alleged Assault\n1. T/C Mild traumatic brain injury\n2. T/C Traumatic Brain Injury\n3. T/C Facial Bone Fracture\n4. Periorbital Hematoma, Left\n5. Abrasion, Temporal Area, Left',noi:'Alleged Assault',toi:'23:55',doi:'2026-10-02',poi:'San Juan',injuryNarrative:'Patient was drinking with his neighbors when another neighbor not part of their group suddenly attacked and hit him using a wood “dos por dos” on the left side of his head once, sustaining left periorbital ecchymosis, left parietooccipital area tenderness, and abrasions on the left frontotemporal area. Patient reported headache, PS 5/10, epistaxis, and hematemesis about one cup in volume once. No loss of consciousness, blurring of vision, or otorrhagia.',pmhSelections:['None'],immunizationSelections:['Childhood Immunizations','COVID-19 vaccine'],pshSmoking:'Yes',pshAlcohol:'Yes',pshDrugs:'No',allergies:'None',medicationsNone:'yes',familyDiseasesNone:'yes',traumaSurvey:'Patient was seen in the ER, awake, alert, and conscious, not in respiratory distress.',traumaFindings:Object.fromEntries(traumaFindings.map(item=>[item,'-']))}); setEnt(v=>({...v,traumaFindings:{...v.traumaFindings,'Full EOM':'+'}}));setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);setCopied(false);return; }
    if(tab==='ent') { setEnt({...blank(entFields),entFormat:'complete',pmhSelections:['None'],immunizationSelections:['Childhood Immunizations','COVID-19 vaccine'],date:'2026-10-03',name:'SOLITORIO, KATHLEEN PALLER',age:'23',sex:'F',address:'Can-aga, Sibonga, Cebu',religion:'Roman Catholic',contact:'09986439571',cc:'Left sided pain (Face)',hpi:'1 month PTC, noted sudden onset of sharp, intermittent pain of her left tooth lasting for 1 hour occurring twice a day. PS 3/10. No associated fever, nausea, or vomiting. Self-medicated with Ponstan 500 mg PO OD with relief. No consults done.\n\n3 weeks PTC, noted recurrence of left-sided pain, now constant with PS 8/10, associated with swelling of the left side of face. No fever, nausea, or vomiting. Consulted a dentist and was prescribed Co-amoxiclav 625 mg BID for 7 days and Mefenamic Acid 500 mg with no relief.\n\n8 days PTC, worsening swelling, now erythematous, PS 9/10.\n\n2 days PTC, dentist requested panoramic x-ray. At Chong Hua ER, patient spat out about 10 mL of foul-smelling purulent discharge. Prescribed Ciprofloxacin, Clindamycin, Celecoxib, and Chlorhexidine. Due to minimal improvement, sought consult at our institution.',assessment:'',pshSmoking:'No',pshAlcohol:'No',pshDrugs:'No',allergies:'None',familyHtn:'',familyDm:'',familyAsthma:'Paternal',familyMalignancy:'',generalSurvey:'Patient was seen awake, alert, and conscious, not in respiratory distress.',peEyes:{'Full EOMs':'+','Subconjunctival hemorrhage':'-','Icteric sclerae':'-','Periorbital swelling':'-'},peHead:{'Normocephalic':'+','Lesions':'-','Swelling':'+','Facial avulsion':'-','Laceration':'-'},peEars:{'Otalgia':'-','Otorrhea':'-','Otorrhagia':'-','Deformities':'-','Tug test':'-','Tragus test':'-','Impacted cerumen':'-','Hearing loss':'-','Perforated tympanic membrane':'-','Foreign body':'-'},peNose:{'Patent nares':'+','Epistaxis':'-','Septal deviation':'-','Sinus tenderness':'-','Bloody discharge':'-','Foreign body':'-','Congestion':'-','Abrasions over bridge of nose':'-'},peMouth:{'Pink moist lips and oral mucosa':'+','Lesions':'-','Sublingual hematoma':'-','Enlarged submandibular gland':'-'},peThroatNeck:{'Trachea at midline':'+','Tenderness':'+','Erythema':'+','Swelling':'+','Palpable neck mass':'-','Left cervical lymphadenopathy':'-','Stridor':'-','Hoarseness':'-','Dysphagia':'-','Odynophagia':'-'}}); setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);setCopied(false); return; }
    if(tab==='ob') {
      setOb({...blank(obFields),name:'Princess Mae Paglinawan',age:'28',mrn:'498244',obs:'G1P0',religion:'Catholic',address:'Catmon, Cebu',occupation:'School Teacher',cc:'Elevated Blood Pressure',hpi:'Two days PTA, patient came to scheduled prenatal visit with AP. Vital signs revealed elevated BP 150/100; repeated BP 140/100. No associated symptoms noted: no blurring of vision, dizziness, nausea, vomiting, or headache. She was advised for admission.',menstrualM:'15 y/o',menstrualI:'Regular',menstrualD:'4 days',menstrualAmount:'4',menstrualSoak:'Moderate, regular pad',mDysmenorrhea:'yes',sexualC1:'18',sexualPartnersQty:'2',lmp:'2025-09-26',edd:'2026-07-03',pmhSelections:['None'],immunizationSelections:['COVID','Booster','Tetanus / TT'],vaccineCovid:'Sinovac x 2 doses',vaccineBooster:'Pfizer',vaccineTt:'x 2 doses','family_Hypertension':'Paternal','family_Diabetes':'None','family_Asthma':'None','family_Cancer':'None','family_Coronary artery disease':'None','family_Thyroid disease':'None','family_Congenital anomalies':'None','family_Twinning':'None',vsBp:'140/100',vsHr:'82',vsRr:'20',vsTemp:'36.3',vsHt:'147',vsPpw:'49',vsWt:'60.8',abdomenAppearance:'Globular',fundalHeight:'33',fht:'120',efw:'3100',leopoldL1:'Breech',leopoldL2:'Fetal back right, small parts left',leopoldL2MR:'FB',leopoldL2ML:'FSP',leopoldL3:'Cephalic (floating)',leopoldL4:'Not engaged',ieSummary:'Closed cervix',bishopDilation:'Closed',admittingDiagnosis:'1. Gravida 1 Para 0, pregnancy uterine, 39 weeks AOG, cephalic, not in labor\n2. Gestational hypertension vs preeclampsia without severe features'});
      setObstetricHistory([Object.assign(makePregnancy(),{outcome:'Current pregnancy'})]);
      setPrenatalVisits([Object.assign(makePrenatalVisit(),{timing:'7 3/7 weeks',details:'TVS confirmed SLIUP. Trace subchorionic hemorrhage noted. Prenatal supplements and dydrogesterone prescribed.'})]);
      setProcedureEvents([makeProcedureEvent()]);
    } else {
      setPedia({...blank(pediaFields),dateLine:'2026-09-21',bed:'5',motherName:'Alkonga, Shejena',address:'Carmen Cebu',civilStatus:'Single',age:'34',ob:'Dr. Hernandez',pedia:'Dr. Pasco',gender:'Girl',obScore:'G2P0 (0010)',lmp:'2026-03-27',aogLmp:'25 3/7 weeks',aogUtz:'24 weeks',edd:'2027-01-01',fh:'-',efw:'-',firstPnc:'7 weeks',maternalBt:'A+',paternalBt:'Unsure',hbsag:'NR',hiv:'NR',syphilis:'NR',papsmear:'Not done',cas:'No gross congenital anomalies',gbs:'Not yet done',ogtt:'Overt DM',allergyFood:'Seafood',allergyMeds:'Aspirin',allergyFoodFlags:['Known allergy'],allergyMedsFlags:['Known allergy'],prenatalMeds:'Calcium BID\nMultivitamins + Iron\nOmegabloc\nFolic acid\nProgesterone intravaginal',maternalHtn:'No',maternalDiabetes:'Yes',maternalAsthma:'No',prenatalHx:'History of spotting since 1st trimester, once weekly. At 17 weeks AOG: overt diabetes managed with medical nutrition therapy, controlled. Urinalysis showed UTI; no antibiotics given. Urine culture negative. At 22 weeks: endocervical polyp. At 24 weeks: short cervix.',usDate:'2026-09-21',latestUs:'Pregnancy uterine, 24 3/7 weeks AOG by FB, SLIUP, cephalic. Adequate amniotic fluid volume. Amniotic sludge at the endocervical canal. Anterior placenta, grade I, high lying. Shortened cervix with 74.2% Y-shaped funneling. sEFW within 10th–90th percentile for AOG.',obHx:'G1: 2024, 24 weeks, complete abortion, placental abruptio, cord coil.\nG2: Current pregnancy.',pmh:['None'],familyHtn:'Maternal',familyDm:'Maternal',familyAsthma:'Both',familyCad:'None',familyCancer:'Maternal',familyCancerDetail:'Lung cancer',familyPcos:'None',familyMental:'None',familyCongenital:'Both',familyTwins:'None',immunizationSelections:['COVID','Booster','Tdap'],covidBrand:'Sinovac',covidDoses:'2',booster1:'Moderna',booster2:'Pfizer',tdapDoses:'1',pshSmoking:'No',pshAlcohol:'Yes',pshAlcoholDetails:'Occasional alcoholic beverage drinker; last intake December 2025',pshDrugs:'No',pshAllergies:'Food: seafood; Medication: aspirin',cc:'Spotting',hpi:'Five days PTA, onset of spotting lightly soaking underwear. No consults done; continued intravaginal progesterone. On the day of admission, mother had prenatal check-up. CAS noted short cervical length and dilatation of the endocervical canal. Good fetal movement; advised admission.',ie:'No IE',lateFh:'-',lateEfw:'-',fht:'150s',plan:'For rescue cerclage and tocolysis'});
      setPediaProcedureSelections(['Previous admission']);
      setPediaProcedureEvents([Object.assign(makeProcedureEvent(),{age:'7 years old',type:'Hospitalization',details:'Admitted due to aspirin allergic reaction'})]);
      setPediaObstetricHistory([Object.assign(makePregnancy(),{year:'2024',gestationalAge:'24 weeks',outcome:'Complete abortion',complications:'Placental abruptio, cord coil'}),Object.assign(makePregnancy(),{outcome:'Current pregnancy'})]);
      setPediaPrenatalVisits([Object.assign(makePrenatalVisit(),{timing:'Since 1st trimester',details:'Spotting once weekly'}),Object.assign(makePrenatalVisit(),{timing:'17 weeks AOG',details:'Overt diabetes controlled with medical nutrition therapy. Urinalysis showed UTI; urine culture negative.'}),Object.assign(makePrenatalVisit(),{timing:'22 weeks AOG',details:'Endocervical polyp.'}),Object.assign(makePrenatalVisit(),{timing:'24 weeks AOG',details:'Short cervix.'})]);
    }
    setCopied(false);
  }

  return <div className="app">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true"/><span>med tools</span></a><span className="product-label">MESSAGE COMPOSER <i/></span></header>
    <main className="page">
      <nav className="tabs" aria-label="Specialty"><button className={tab==='ob'?'active':''} onClick={()=>{setTab('ob');setCopied(false)}}>OB-GYN <span>01</span></button><button className={tab==='pedia'?'active':''} onClick={()=>{setTab('pedia');setCopied(false)}}>PEDIA <span>02</span></button><button className={tab==='ent'?'active':''} onClick={()=>{setTab('ent');setCopied(false)}}>ENT <span>03</span></button></nav>
      <div className="workspace">
        <div className="form-column">
          <div className="form-top"><div><span className="form-index">{tab==='ob'?'01':tab==='pedia'?'02':'03'} / COMPOSE</span><h2>{tab==='ob'?'Obstetric update':tab==='pedia'?'Pediatric update':'ENT update'}</h2></div><div className="form-actions"><button type="button" className="add-row" onClick={loadSample}>Load {tab==='ob'?'OB':tab==='pedia'?'Pedia':ent.entFormat==='trauma'?'Trauma':'ENT'} sample</button><button className="clear-button" onClick={clearForm}>Clear form</button></div></div>
          {tab==='ob' ? <>
            <Section title="Patient information"><div className="grid two">{[['name','NAME'],['age','AGE'],['mrn','MRN'],['obScore','OB SCORE'],['religion','RELIGION'],['status','STATUS'],['address','ADDRESS'],['occupation','OCCUPATION']].map(([key,label])=><Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)} options={key==='status'?[['','Select'],['Single','Single'],['Married','Married'],['Cohabiting','Cohabiting'],['Separated','Separated'],['Widowed','Widowed'],['Other','Other']]:null}/>)}</div></Section>
            <Section title="Chief complaint & present illness"><div className="grid two"><Field label="CC" value={ob.cc} onChange={v=>update('cc',v)} placeholder="e.g. Watery vaginal discharge"/><Field label="CC date & time" type="datetime-local" value={ob.ccDateTime} onChange={v=>update('ccDateTime',v)}/></div><Field label="HPI" multiline value={ob.hpi} onChange={v=>update('hpi',v)} placeholder="Describe onset, duration, associated symptoms, pertinent negatives, and reason for consult."/></Section>
            <Section title="Menstrual history" description="The generated message keeps your M / I / D / A / A format."><div className="grid two"><Field label="M · menarche age" type="number" value={ob.menstrualM} onChange={v=>update('menstrualM',v)}/><Field label="I · cycle regularity" value={ob.menstrualI} onChange={v=>update('menstrualI',v)} options={ [['','Select'],['Regular','Regular'],['Irregular','Irregular']] }/><Field label="Cycle interval (days)" type="number" value={ob.menstrualIntervalDays} onChange={v=>update('menstrualIntervalDays',v)}/><Field label="D · duration (days)" type="number" value={ob.menstrualD} onChange={v=>update('menstrualD',v)}/><Field label="A · pads per day" type="number" value={ob.menstrualAmount} onChange={v=>update('menstrualAmount',v)}/><Field label="A · flow" value={ob.menstrualSoak} onChange={v=>update('menstrualSoak',v)} options={ [['','Select'],['Lightly soaked','Lightly soaked'],['Moderately soaked','Moderately soaked'],['Fully soaked','Fully soaked']] }/></div><div className="toggle-row"><Toggle label="Dysmenorrhea" checked={ob.mDysmenorrhea==='yes'} onChange={v=>update('mDysmenorrhea',v)}/><Field label="Associated symptoms / medication" value={ob.menstrualAssociated} onChange={v=>update('menstrualAssociated',v)}/></div></Section>
            <Section title="Sexual history" description="C = coitarche, P = partners / Pap smear, S = STI history."><div className="grid two"><Field label="C · age at coitarche" type="number" value={ob.sexualC1} onChange={v=>update('sexualC1',v)}/><Field label="P · number of partners" type="number" value={ob.sexualPartnersQty} onChange={v=>update('sexualPartnersQty',v)}/><Field label="Partner gender" value={ob.sexualPartnersGender} onChange={v=>update('sexualPartnersGender',v)} options={ [['','Select'],['Male','Male'],['Female','Female'],['Both','Both'],['Other','Other']] }/><Field label="C · contraception" value={ob.sexualC2} onChange={v=>update('sexualC2',v)} options={ [['','Select'],['None','None'],['Condom','Condom'],['OCP','OCP'],['IUD','IUD'],['Injectable','Injectable'],['Implant','Implant'],['Other','Other']] }/>{ob.sexualC2==='Other'&&<Field label="Other contraception" value={ob.sexualContraceptiveOther} onChange={v=>update('sexualContraceptiveOther',v)}/>}<Field label="P · Pap smear date" type="date" value={ob.sexualP2} onChange={v=>update('sexualP2',v)}/><Field label="Pap smear result" value={ob.sexualPapFinding} onChange={v=>update('sexualPapFinding',v)} options={ [['','Select'],['Not done','Not done'],['Normal','Normal'],['Abnormal','Abnormal'],['Pending','Pending']] }/><Field label="S · STI history" value={ob.sexualS} onChange={v=>update('sexualS',v)} options={ [['','Select'],['None','None'],['History','History'],['Unsure','Unsure']] }/>{ob.sexualS==='History'&&<Field label="STI details" value={ob.sexualStiDetails} onChange={v=>update('sexualStiDetails',v)}/>}</div></Section>
            <Section title="Obstetric history"><div className="grid two">{[['gravidaCount','Gravida'],['parityCount','Parity'],['termCount','Term'],['pretermCount','Preterm'],['abortionCount','Abortion'],['liveBirthCount','Live birth']].map(([key,label])=><Field key={key} label={label} type="number" value={ob[key]} onChange={v=>update(key,v)}/>)}</div><div className="grid two"><Field label="OB score (optional, if you prefer to enter it directly)" value={ob.obs} onChange={v=>update('obs',v)} placeholder="e.g. G2P0 (0010)"/><Field label="LMP" type="date" value={ob.lmp} onChange={v=>update('lmp',v)}/><Field label="PMP" type="date" value={ob.pmp} onChange={v=>update('pmp',v)}/><Field label="EDD" type="date" value={ob.edd} onChange={v=>update('edd',v)}/></div></Section>
            <EditableLogTable title="Obstetric history logs" description="Add one row per pregnancy; the message numbers entries G1, G2, and so on." rows={obstetricHistory} setRows={setObstetricHistory} createRow={makePregnancy} columns={pregnancyLogColumns} rowLabel="G" addLabel="Add pregnancy" kind="pregnancies"/><Section title="Prenatal visit history" description="Add one entry for each visit or milestone, in chronological order."><EditableLogTable title="Prenatal history log" description="Record AOG or visit timing and the corresponding details." rows={prenatalVisits} setRows={setPrenatalVisits} createRow={makePrenatalVisit} columns={prenatalLogColumns} rowLabel="Visit" addLabel="Add prenatal visit" kind="prenatal"/></Section>
            <Section title="Past medical history"><small>Choose None alone, or select all applicable history.</small><CheckGroup options={pmhOptions} selected={ob.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={obProcedureSelections} onChange={setObProcedureSelections}/>{obProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={procedureEvents} setRows={setProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Current medications"><Field label="Current Medications" multiline value={ob.medications} onChange={v=>update('medications',v)}/></Section><Section title="Personal & social history"><div className="repeat-heading"><span>Allergies</span><small>Choose one status; add details if present.</small></div><CheckGroup options={['No known allergies','Known allergy']} selected={ob.allergyFlags} onChange={v=>update('allergyFlags',v)} exclusive={['No known allergies','Known allergy']}/>{Array.isArray(ob.allergyFlags)&&ob.allergyFlags.includes('Known allergy')&&<Field label="Food and drug allergy details" value={ob.allergies} onChange={v=>update('allergies',v)} placeholder="List the allergy and reaction if known."/>}<div className="grid two"><Field label="Smoker" value={ob.smoking} onChange={v=>update('smoking',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/><Field label="Alcoholic beverage drinker" value={ob.alcohol} onChange={v=>update('alcohol',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/>{ob.alcohol==='Yes'&&<Field label="Alcohol details" value={ob.alcoholDetails} onChange={v=>update('alcoholDetails',v)} placeholder="e.g. Occasional; last intake January 2025"/>}<Field label="Illicit drug use" value={ob.illicitDrugUse} onChange={v=>update('illicitDrugUse',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/></div></Section>
            <Section title="Immunizations"><CheckGroup options={['COVID','Influenza','Pneumococcal','Tetanus / TT','Tdap','Booster']} selected={ob.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/><div className="grid two">{[['vaccineCovid','COVID details'],['vaccineFlu','Influenza details'],['vaccinePneumococcal','Pneumococcal details'],['vaccineTt','Tetanus / TT details'],['vaccineTdap','Tdap details'],['vaccineBooster','Booster details']].map(([key,label])=>Array.isArray(ob.immunizationSelections)&&ob.immunizationSelections.includes(label.replace(' details',''))?<Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)}/>:null)}</div></Section>
            <Section title="Family history"><Toggle label="No known family history" checked={ob.familyHistoryNone==='yes'} onChange={value=>{update('familyHistoryNone',value);familyLabels.forEach(label=>update(`family_${label}`,value?'None':''));}}/>{ob.familyHistoryNone!=='yes'&&<div className="family-checkbox-grid">{familyLabels.map(label=><FamilyRow key={label} label={label} value={ob[`family_${label}`]||''} onChange={value=>update(`family_${label}`,value)}/>)}</div>}{['Maternal','Paternal','Both'].includes(ob.family_Cancer)&&<Field label="Cancer type" value={ob.family_CancerDetail} onChange={v=>update('family_CancerDetail',v)} placeholder="e.g. Lung cancer"/>}</Section>
            <Section title="Vital signs"><div className="grid two">{[['vsBp','BP'],['vsHr','HR'],['vsRr','RR'],['vsTemp','TEMP'],['vsPpw','PPW'],['vsWt','WT'],['vsHt','HT']].map(([key,label])=><Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)}/>)}</div></Section>
            <Section title="Physical examination" description="Select the documented findings. Selecting Essentially normal clears abnormal findings in that system."><div className="exam-grid">{examGroups.map(([title,options])=>{const keys={'HEENT':'examHEENT','Chest / lungs':'examChest','Cardiovascular':'examCV','Abdomen':'examAbdomen','GU / IE':'examGU','Skin / extremities':'examSkin'};return <div className="exam-card" key={title}><h3>{title}</h3><CheckGroup options={options} selected={ob[keys[title]]} onChange={v=>update(keys[title],v)} exclusive={['Essentially normal']}/></div>;})}</div><div className="repeat-heading spaced"><span>Abdominal / obstetric exam details</span><small>Enter only values documented for this encounter.</small></div><div className="grid two"><Field label="Abdominal appearance" value={ob.abdomenAppearance} onChange={v=>update('abdomenAppearance',v)} placeholder="e.g. Globular"/><Field label="Fundal height (cm)" type="number" value={ob.fundalHeight} onChange={v=>update('fundalHeight',v)}/><Field label="Fetal heart tone" value={ob.fht} onChange={v=>update('fht',v)}/><Field label="Estimated fetal weight (g)" type="number" value={ob.efw} onChange={v=>update('efw',v)}/></div><div className="repeat-heading spaced"><span>Cervical assessment · Bishop score</span><small>Select findings documented on examination.</small></div><div className="grid two"><Field label="Dilation" value={ob.bishopDilation} onChange={v=>update('bishopDilation',v)} options={bishopOptions.dilation}/><Field label="Effacement" value={ob.bishopEffacement} onChange={v=>update('bishopEffacement',v)} options={bishopOptions.effacement}/><Field label="Station" value={ob.bishopStation} onChange={v=>update('bishopStation',v)} options={bishopOptions.station}/><Field label="Consistency" value={ob.bishopConsistency} onChange={v=>update('bishopConsistency',v)} options={bishopOptions.consistency}/><Field label="Position" value={ob.bishopPosition} onChange={v=>update('bishopPosition',v)} options={bishopOptions.position}/></div><small className="score-summary">{calculateBishopScore(ob)===null?'Bishop score appears when all five findings are selected.':`Calculated Bishop score: ${calculateBishopScore(ob)}/13`}</small><div className="repeat-heading spaced"><span>Leopold maneuvers</span><small>Select the finding for each step.</small></div><div className="grid two"><Field label="L1 · fundus presentation" value={ob.leopoldL1} onChange={v=>update('leopoldL1',v)} options={[["","Select"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L2 · maternal right" value={ob.leopoldL2MR} onChange={v=>update('leopoldL2MR',v)} options={[["","Select"],["FB","FB"],["FSP","FSP"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L2 · maternal left" value={ob.leopoldL2ML} onChange={v=>update('leopoldL2ML',v)} options={[["","Select"],["FB","FB"],["FSP","FSP"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L3 · Pawlik's grip" value={ob.leopoldL3} onChange={v=>update('leopoldL3',v)} options={[["","Select"],["Cephalic (floating)","Cephalic (floating)"],["Cephalic (engaged)","Cephalic (engaged)"],["Breech","Breech"],["Empty","Empty"]]}/><Field label="L4 · engagement" value={ob.leopoldL4} onChange={v=>update('leopoldL4',v)} options={[["","Select"],["Engaged","Engaged"],["Not engaged","Not engaged"]]}/></div><Field label="Admitting diagnosis" multiline value={ob.admittingDiagnosis} onChange={v=>update('admittingDiagnosis',v)} placeholder="Enter each diagnosis on a new line."/></Section>
          </> : tab==='pedia' ? <>
            <div className="format-note"><b>Pedia message format</b><span>Fields and preview follow your September 21 sample. Leave unknown details blank or enter the wording your team uses.</span></div>
            <Section title="Date & location"><div className="grid two"><Field label="Update date" type="date" value={pedia.dateLine} onChange={v=>update('dateLine',v)}/><Field label="LRDR Bed #" value={pedia.bed} onChange={v=>update('bed',v)}/></div></Section>
            <Section title="Mother & care team"><div className="grid two">{[['motherName',"Mother's name"],['address','Address'],['civilStatus','Civil Status'],['age','Age'],['ob','OB'],['pedia','Pedia'],['gender',"Baby's Gender"]].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)} options={key==='civilStatus'?[['','Select'],['Single','Single'],['Married','Married'],['Cohabiting','Cohabiting'],['Separated','Separated'],['Widowed','Widowed'],['Other','Other']]:key==='gender'?[['','Select'],['Girl','Girl'],['Boy','Boy'],['Unknown','Unknown'],['Other','Other']]:null}/>)}</div></Section>
            <Section title="Pregnancy details"><div className="grid two">{[['obScore','OB score'],['lmp','LMP'],['aogLmp','AOG by LMP'],['aogUtz','AOG by UTZ'],['edd','EDD'],['fh','FH'],['efw','EFW'],['firstPnc','First PNC']].map(([key,label])=><Field key={key} label={label} type={['lmp','edd'].includes(key)?'date':'text'} value={pedia[key]} onChange={v=>update(key,v)}/>)}</div></Section>
            <Section title="Maternal labs & screening"><div className="grid two">{[['maternalBt','Mat BT'],['paternalBt','Pat BT'],['hbsag','HbsAg'],['hiv','HIV'],['syphilis','Syphilis'],['papsmear','Papsmear'],['cas','CAS'],['gbs','GBS'],['ogtt','OGTT']].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)}/>)}</div></Section>
            
            <Section title="Prenatal care & complications"><Field label="Prenatal vitamins / meds" multiline value={pedia.prenatalMeds} onChange={v=>update('prenatalMeds',v)}/><div className="grid two">{[['maternalHtn','Hypertension'],['maternalDiabetes','Diabetes'],['maternalAsthma','Asthma']].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)} options={ [['','Not specified'],['No','No'],['Yes','Yes']] }/>)}</div><Field label="Other maternal complications" value={pedia.complicationsOther} onChange={v=>update('complicationsOther',v)}/><EditableLogTable title="Pertinent prenatal history log" description="Record AOG or visit timing and the corresponding details." rows={pediaPrenatalVisits} setRows={setPediaPrenatalVisits} createRow={makePrenatalVisit} columns={prenatalLogColumns} rowLabel="Visit" addLabel="Add prenatal visit" kind="prenatal"/></Section>
            <Section title="Latest ultrasound"><div className="grid two"><Field label="Date" type="date" value={pedia.usDate} onChange={v=>update('usDate',v)}/></div><Field label="Details" multiline value={pedia.latestUs} onChange={v=>update('latestUs',v)}/></Section>
            <EditableLogTable title="Obstetric history logs" description="Add one row per pregnancy; the message numbers entries G1, G2, and so on." rows={pediaObstetricHistory} setRows={setPediaObstetricHistory} createRow={makePregnancy} columns={pregnancyLogColumns} rowLabel="G" addLabel="Add pregnancy" kind="pregnancies"/><Section title="Past medical history"><small>Choose None alone, or select all applicable medical conditions.</small><CheckGroup options={pediaPmhOptions} selected={pedia.pmh} onChange={v=>update('pmh',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={pediaProcedureSelections} onChange={setPediaProcedureSelections}/>{pediaProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={pediaProcedureEvents} setRows={setPediaProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Vaccines"><CheckGroup options={['COVID','Influenza','Pneumococcal','Tetanus / TT','Tdap','Booster']} selected={pedia.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/><div className="grid two">{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('COVID')&&<><Field label="Covid vaccine" value={pedia.covidBrand} onChange={v=>update('covidBrand',v)} options={ [['','Select'],['Sinovac','Sinovac'],['Pfizer','Pfizer'],['Moderna','Moderna'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/><Field label="Covid doses" type="number" value={pedia.covidDoses} onChange={v=>update('covidDoses',v)}/></>}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Influenza')&&<Field label="Influenza details" value={pedia.vaccineFlu} onChange={v=>update('vaccineFlu',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Pneumococcal')&&<Field label="Pneumococcal details" value={pedia.vaccinePneumococcal} onChange={v=>update('vaccinePneumococcal',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Booster')&&<><Field label="Booster 1" value={pedia.booster1} onChange={v=>update('booster1',v)} options={ [['','None'],['Moderna','Moderna'],['Pfizer','Pfizer'],['Sinovac','Sinovac'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/><Field label="Booster 2" value={pedia.booster2} onChange={v=>update('booster2',v)} options={ [['','None'],['Moderna','Moderna'],['Pfizer','Pfizer'],['Sinovac','Sinovac'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/></>}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Tdap')&&<Field label="Prenat · Tdap doses" type="number" value={pedia.tdapDoses} onChange={v=>update('tdapDoses',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Tetanus / TT')&&<Field label="Prenat · TT doses" type="number" value={pedia.ttDoses} onChange={v=>update('ttDoses',v)}/>}</div></Section>
            <Section title="Family medical history"><Toggle label="No known family history" checked={pedia.familyHistoryNone==='yes'} onChange={value=>{update('familyHistoryNone',value);pediaFamily.forEach(([key])=>update(key,value?'None':''));}}/>{pedia.familyHistoryNone!=='yes'&&<div className="family-checkbox-grid">{pediaFamily.map(([key,label])=><FamilyRow key={key} label={label} value={pedia[key]||''} onChange={value=>update(key,value)}/>)}</div>}{!pedia.familyHistoryNone&&(['Paternal','Maternal','Both'].includes(pedia.familyCancer))&&<Field label="Cancer type / relative" value={pedia.familyCancerDetail} onChange={v=>update('familyCancerDetail',v)}/>}</Section>
            <Section title="Personal & social history"><div className="grid two"><Field label="Smoking history" value={pedia.pshSmoking} onChange={v=>update('pshSmoking',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/><Field label="Alcohol history" value={pedia.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/>{pedia.pshAlcohol==='Yes'&&<Field label="Alcohol details" value={pedia.pshAlcoholDetails} onChange={v=>update('pshAlcoholDetails',v)} placeholder="e.g. Occasional; last intake December 2025"/>}<Field label="Illicit drug use" value={pedia.pshDrugs} onChange={v=>update('pshDrugs',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/></div><Field label="Food or drug allergies" value={pedia.pshAllergies} onChange={v=>update('pshAllergies',v)}/></Section>
            <Section title="Current presentation & plan"><Field label="CC" value={pedia.cc} onChange={v=>update('cc',v)}/><Field label="HPI" multiline value={pedia.hpi} onChange={v=>update('hpi',v)}/><div className="grid two"><Field label="IE" value={pedia.ie} onChange={v=>update('ie',v)}/><Field label="FH · current" value={pedia.lateFh} onChange={v=>update('lateFh',v)}/><Field label="EFW · current" value={pedia.lateEfw} onChange={v=>update('lateEfw',v)}/><Field label="FHT" value={pedia.fht} onChange={v=>update('fht',v)}/></div><Field label="Plan" multiline value={pedia.plan} onChange={v=>update('plan',v)}/></Section>
          </> : <>
            <div className="format-note"><b>ENT message format</b><span>Switch between the short new blotter update and the complete history format.</span></div>
            <Section title="Update format"><Field label="Message type" value={ent.entFormat} onChange={v=>update('entFormat',v)} options={[['blotter','New blotter update'],['complete','Complete history'],['trauma','Trauma']]}/></Section>
            {ent.entFormat==='trauma'?<Section title="General data"><div className="grid two"><Field label="Date in trauma heading" type="date" value={ent.date} onChange={v=>update('date',v)}/><Field label="Time received" type="time" value={ent.traumaTimeReceived} onChange={v=>update('traumaTimeReceived',v)}/><Field label="Name" value={ent.name} onChange={v=>update('name',v)}/><Field label="Age" type="number" value={ent.age} onChange={v=>update('age',v)}/><Field label="Gender" value={ent.sex} onChange={v=>update('sex',v)} options={[["","Select"],["M","Male"],["F","Female"]]}/><Field label="Hospital #" value={ent.hospitalNumber} onChange={v=>update('hospitalNumber',v)}/><Field label="Reason for referral" value={ent.reasonReferral} onChange={v=>update('reasonReferral',v)}/></div></Section>:<Section title="General data"><div className="grid two"><Field label="Date" type="date" value={ent.date} onChange={v=>update('date',v)}/><Field label="Name" value={ent.name} onChange={v=>update('name',v)}/><Field label="Age" value={ent.age} onChange={v=>update('age',v)}/><Field label="Sex" value={ent.sex} onChange={v=>update('sex',v)} options={[["","Select"],["M","Male"],["F","Female"]]}/><Field label="Address" value={ent.address} onChange={v=>update('address',v)}/>{ent.entFormat==='blotter'&&<Field label="Nationality" value={ent.nationality} onChange={v=>update('nationality',v)}/>}<Field label="Religion" value={ent.religion} onChange={v=>update('religion',v)}/><Field label="Cellphone number" value={ent.contact} onChange={v=>update('contact',v)}/>{ent.entFormat==='blotter'&&<Field label="Chief complaint" value={ent.cc} onChange={v=>update('cc',v)}/>}</div></Section>}
            {ent.entFormat==='trauma'&&<><Section title="Working impression & injury details"><Field label="Working impression" multiline value={ent.workingImpression} onChange={v=>update('workingImpression',v)} placeholder="Enter each impression on a new line."/><div className="grid two"><Field label="NOI · Nature of injury" value={ent.noi} onChange={v=>update('noi',v)}/><Field label="TOI · Time of injury" type="time" value={ent.toi} onChange={v=>update('toi',v)}/><Field label="DOI · Date of injury" type="date" value={ent.doi} onChange={v=>update('doi',v)}/><Field label="POI · Place of injury" value={ent.poi} onChange={v=>update('poi',v)}/></div><Field label="Injury narrative" multiline value={ent.injuryNarrative} onChange={v=>update('injuryNarrative',v)}/></Section><Section title="Past medical history" description="Choose None alone, or select all applicable history."><CheckGroup options={entPmhOptions} selected={ent.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/><Toggle label="No maintenance medication" checked={ent.medicationsNone==='yes'} onChange={v=>update('medicationsNone',v)}/>{ent.medicationsNone!=='yes'&&<Field label="Maintenance medications" value={ent.maintenanceMeds} onChange={v=>update('maintenanceMeds',v)}/>}</Section><Section title="Previous admissions or surgeries" description="Select each applicable history, then add one row per event."><CheckGroup options={procedureHistoryOptions} selected={entProcedureSelections} onChange={setEntProcedureSelections}/>{entProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={entProcedureEvents} setRows={setEntProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Immunizations"><CheckGroup options={["Childhood Immunizations","COVID-19 vaccine"]} selected={ent.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/></Section><Section title="Personal & social history"><div className="grid two"><Field label="Smoking history" value={ent.pshSmoking} onChange={v=>update('pshSmoking',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Alcohol history" value={ent.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Illicit drug use" value={ent.pshDrugs} onChange={v=>update('pshDrugs',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Food or drug allergies" value={ent.allergies} onChange={v=>update('allergies',v)}/></div></Section><Section title="Family history"><Toggle label="No known family history" checked={ent.familyDiseasesNone==='yes'} onChange={v=>{update('familyDiseasesNone',v);entFamilyFields.forEach(([key])=>update(key,''));}}/>{ent.familyDiseasesNone!=='yes'&&<div className="family-checkbox-grid">{entFamilyFields.map(([key,label])=><FamilyRow key={key} label={label} value={ent[key]||''} onChange={v=>update(key,v)}/>)}</div>}</Section><Section title="Physical examination"><Field label="General survey" multiline value={ent.traumaSurvey} onChange={v=>update('traumaSurvey',v)}/><StatusChecklist items={traumaFindings} selected={ent.traumaFindings} onChange={v=>update('traumaFindings',v)}/></Section></>}{ent.entFormat==='complete'&&<><Section title="History & assessment"><Field label="History of present illness" multiline value={ent.hpi} onChange={v=>update('hpi',v)}/><Field label="Assessment" multiline value={ent.assessment} onChange={v=>update('assessment',v)}/></Section><Section title="Past medical history"><small>Choose None alone, or select all applicable history.</small><CheckGroup options={entPmhOptions} selected={ent.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={entProcedureSelections} onChange={setEntProcedureSelections}/>{entProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={entProcedureEvents} setRows={setEntProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Immunizations"><CheckGroup options={["Childhood Immunizations","COVID-19 vaccine"]} selected={ent.immunizationSelections} onChange={v=>update("immunizationSelections",v)}/></Section><Section title="Personal & social history"><Field label="Smoking history" value={ent.pshSmoking} onChange={v=>update('pshSmoking',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Alcohol history" value={ent.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Illicit drug use" value={ent.pshDrugs} onChange={v=>update('pshDrugs',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Food or drug allergies" value={ent.allergies} onChange={v=>update('allergies',v)}/></Section><Section title="Family history"><div className="family-checkbox-grid">{entFamilyFields.map(([key,label])=><FamilyRow key={key} label={label} value={ent[key]||''} onChange={v=>update(key,v)}/>)}</div></Section><Section title="Physical examination"><Field label="General survey" multiline value={ent.generalSurvey} onChange={v=>update('generalSurvey',v)}/>{entExamGroups.map(([label,key,items])=><div className="exam-card" key={key}><h3>{label}</h3><StatusChecklist items={items} selected={ent[key]} onChange={v=>update(key,v)}/></div>)}</Section></>}
          </>}
        </div>
        <aside className="preview-column"><div className="preview-sticky"><div className="preview-heading"><div><span className="form-index">LIVE PREVIEW</span><h2>Ready to send</h2></div><span className="live-dot">LIVE</span></div><div className="preview-paper"><div className="paper-top"><span>MESSAGE PREVIEW</span><span>PLAIN TEXT</span></div><textarea className="preview-output" readOnly value={output} aria-label="Generated message preview"/></div><button className="copy-button" onClick={copyOutput}><span>{copied?'✓':'▣'}</span>{copied?'Copied':'Copy message'}<kbd>{copied?'READY':'⌘ C'}</kbd></button><p className="preview-hint">Draft saves automatically in this browser on this device. Clear the form to remove its saved draft.</p></div></aside>
      </div>
    </main>
  </div>;
}
