import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DRAFT_STORAGE_KEY = 'med-tools-form-draft-v1';
const SHOW_PRESCRIPTION_TAB = false;
const SHOW_OB_INTERVIEW = false;
const InterviewContext = createContext(null);
function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
const EMPTY_RX_DRAFT = {
  name: '', date: localToday(), address: '', age: '', gender: '', prescription: '',
  prescriber: '', license: '', ptr: '', s2: '', tin: ''
};

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
  ['firstUtzDate','First ultrasound date'], ['firstUtzAogWeeks','First ultrasound AOG weeks'], ['firstUtzAogDays','First ultrasound AOG days'], ['useUtzDating','Use ultrasound dating'],
  ['newMomName','New Mom · Name'], ['newMomAog','New Mom · AOG by UTZ'], ['newMomObScore','New Mom · OB score'], ['newMomMpd','New Mom · 30/PD'], ['newMomOb','New Mom · OB'], ['newMomPedia','New Mom · Pedia'], ['newMomIeTime','New Mom · IE time'], ['newMomDilation','New Mom · Dilation'], ['newMomEffacement','New Mom · Effacement'], ['newMomRupture','New Mom · Rupture / fluid / time'], ['newMomPosition','New Mom · Position'], ['newMomConsistency','New Mom · Consistency'], ['newMomStation','New Mom · Station'], ['newMomSe','New Mom · SE findings'], ['newMomFundalHeight','New Mom · Fundal height'], ['newMomEfw','New Mom · EFW'], ['newMomFht','New Mom · FHT'], ['newMomPlan','New Mom · Plan'],
  ['gyneAbdominalExam','Gynecologic abdominal exam findings'], ['abdomenAppearance','Abdominal appearance'], ['fundalHeight','Fundal height'], ['fht','FHT'], ['efw','EFW'], ['leopoldL1','Leopold L1'], ['leopoldL2','Leopold L2'], ['leopoldL2MR','Leopold L2 maternal right'], ['leopoldL2ML','Leopold L2 maternal left'], ['leopoldL3','Leopold L3'], ['leopoldL4','Leopold L4'], ['peIntroitus','I · Introitus'], ['peCervix','C · Cervix'], ['peUterus','U · Uterus'], ['peAdnexa','A · Adnexa'], ['peDischarge','D · Discharge / membranes'], ['ieSummary','IE summary'], ['bishopDilation','Cervical dilation'], ['bishopEffacement','Cervical effacement'], ['bishopStation','Cervical station'], ['bishopConsistency','Cervical consistency'], ['bishopPosition','Cervical position'], ['admittingDiagnosis','Admitting diagnosis'],
  ['gravidaCount','Gravida count'], ['parityCount','Parity count'], ['termCount','Term count'], ['pretermCount','Preterm count'], ['abortionCount','Abortion count'], ['liveBirthCount','Live birth count'],
  ['vaccineCovid','COVID'], ['vaccineBooster','Booster'], ['vaccineTdap','Tdap'], ['vaccineTt','TT'],
  ['allergies','FOOD AND DRUG ALLERGIES'], ['allergyStatus','ALLERGY STATUS'], ['smoking','Smoker'], ['alcohol','Alcohol'], ['alcoholDetails','Alcohol details'], ['illicitDrugUse','Illicit drug use'],
  ['menstrualSoak','Flow'], ['mDysmenorrhea','Dysmenorrhea'],
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
const obFields = obTextFields.concat(familyLabels.map(label=>[`family_${label}`,label]),[['family_CancerDetail','Cancer type / details'],['ccDateTimeOmit','Omit CC date and time']]);
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
  effacement:[['','Select'],['SE','SE'],['0-30%','0-30%'],['40-50%','40-50%'],['60-70%','60-70%'],['≥80%','≥80%']],
  station:[['','Select'],['Floating','Floating'],['-3','-3'],['-2','-2'],['-1','-1'],['0','0'],['+1','+1'],['+2','+2'],['+3 / Engaged','+3 / Engaged']],
  consistency:[['','Select'],['Firm','Firm'],['Medium','Medium'],['Soft','Soft']],
  position:[['','Select'],['Posterior','Posterior'],['Midposition','Midposition'],['Anterior','Anterior']],
};
const bishopPoints={dilation:{Closed:0,'1 cm':1,'2 cm':1,'3 cm':2,'4 cm':2,'≥5 cm':3},effacement:{SE:0,'0-30%':0,'SE / 0-30%':0,'40-50%':1,'60-70%':2,'≥80%':3},station:{'-3':0,Floating:0,'-3 / Floating':0,'-2':1,'-1':2,'0':2,'+1':3,'+2':3,'+3 / Engaged':3},consistency:{Firm:0,Medium:1,Soft:2},position:{Posterior:0,Midposition:1,Anterior:2}};
function calculateBishopScore(data) {
  const keys=['dilation','effacement','station','consistency','position'];
  if(!keys.every(key=>data[`bishop${key[0].toUpperCase()}${key.slice(1)}`])) return null;
  return keys.reduce((total,key)=>total+bishopPoints[key][data[`bishop${key[0].toUpperCase()}${key.slice(1)}`]],0);
}
function parseDateValue(value) {
  const text=String(value||'').trim();
  let match=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(match){const [,y,m,d]=match;return validDateParts(Number(y),Number(m),Number(d));}
  match=text.match(/^(\d{4})-(\d{1,2})$/);
  if(match)return validMonthParts(Number(match[1]),Number(match[2]));
  match=text.match(/^(\d{1,2})[\/. -](\d{4})$/);
  if(match)return validMonthParts(Number(match[2]),Number(match[1]));
  match=text.match(/^([a-z]+)[, ]+(\d{4})$/i);
  if(match){const monthNames=['january','february','march','april','may','june','july','august','september','october','november','december'];const month=monthNames.findIndex(name=>name===match[1].toLowerCase()||name.slice(0,3)===match[1].toLowerCase());if(month>=0)return validMonthParts(Number(match[2]),month+1);}
  match=text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})$/);
  if(match){let [,m,d,y]=match;let year=Number(y);if(y.length===2)year+=year<50?2000:1900;return validDateParts(year,Number(m),Number(d));}
  return '';
}
function validMonthParts(year,month) {return month>=1&&month<=12?`${year}-${String(month).padStart(2,'0')}`:'';}
function validDateParts(year,month,day) {
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`:'';
}
function displayDateValue(value) {
  const iso=parseDateValue(value);if(!iso)return String(value||'');
  const [year,month,day]=iso.split('-');return day?`${month}/${day}/${year}`:`${month}/${year}`;
}
function DateInput({value,onChange,ariaLabel='',table=false,disabled=false}) {
  const [text,setText]=useState(()=>displayDateValue(value));
  const textRef=useRef(null), pickerRef=useRef(null);
  useEffect(()=>{if(document.activeElement!==textRef.current)setText(displayDateValue(value));},[value]);
  const updateText=raw=>{setText(raw);onChange(parseDateValue(raw)||raw);};
  const chooseDate=raw=>{onChange(raw);setText(displayDateValue(raw));};
  const openPicker=()=>{const picker=pickerRef.current;if(!picker)return;try{if(picker.showPicker)picker.showPicker();else picker.click();}catch{picker.focus();picker.click();}};
  return <span className={`date-input-wrap${table?' date-input-table':''}`}><input ref={textRef} type="text" inputMode="text" placeholder="MM/YYYY or MM/DD/YYYY" aria-label={ariaLabel} disabled={disabled} value={text} onChange={event=>updateText(event.target.value)} onBlur={()=>{const parsed=parseDateValue(text);if(parsed){setText(displayDateValue(parsed));onChange(parsed);}}}/><button type="button" className="date-picker-button" disabled={disabled} aria-label={`Open calendar for ${ariaLabel||'date'}`} title="Open calendar" onClick={openPicker}>▦</button><input ref={pickerRef} className="date-picker-native" type="date" tabIndex={-1} aria-hidden="true" disabled={disabled} value={/^\d{4}-\d{2}-\d{2}$/.test(parseDateValue(value))?parseDateValue(value):''} onChange={event=>chooseDate(event.target.value)}/></span>;
}

function formatDate(value, short=false) {
  if (!value) return '';
  const normalized=parseDateValue(value)||value;
  if(/^\d{4}-\d{2}$/.test(normalized)){const [year,month]=normalized.split('-').map(Number);return new Date(year,month-1,1).toLocaleDateString('en-US',{month:short?'short':'long',year:'numeric'});}
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  if (short) return date.toLocaleDateString('en-US',{month:'short',day:'numeric'}).replace(/^Sep /,'Sept ');
  return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}
function calendarDayNumber(value) {
  const normalized=parseDateValue(value);
  if (!normalized||!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return Math.floor(Date.UTC(year, month-1, day) / 86400000);
}
function formatAogDays(totalDays) {
  if (!Number.isFinite(totalDays) || totalDays < 0) return '';
  return `${Math.floor(totalDays/7)} ${totalDays%7}/7 wks`;
}
function calculateLmpAog(lmp, date) {
  const start=calendarDayNumber(lmp), end=calendarDayNumber(date);
  return start===null||end===null ? '' : formatAogDays(end-start);
}
function calculateEdd(lmp) {
  const day=calendarDayNumber(lmp);
  if(day===null) return '';
  const date=new Date((day+280)*86400000);
  return `${date.getUTCMonth()+1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}
function calculateUtzAog(date, utzDate, utzWeeks, utzDays) {
  const start=calendarDayNumber(utzDate), end=calendarDayNumber(date);
  if(start===null||end===null||utzWeeks===''||utzDays==='') return '';
  const weeks=Number(utzWeeks), days=Number(utzDays);
  if(!Number.isFinite(weeks)||!Number.isFinite(days)) return '';
  return formatAogDays(weeks*7+days+(end-start));
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
function calculateObScore(data) {
  const gravida=clean(data.gravidaCount), parity=clean(data.parityCount);
  if(!gravida&&!parity)return '';
  const score=`G${gravida||'0'}P${parity||'0'}`;
  const keys=['termCount','pretermCount','abortionCount','liveBirthCount'];
  return keys.some(key=>clean(data[key]))?`${score} (${keys.map(key=>clean(data[key])||'0').join('')})`:score;
}
let nextRowId = 0;
function makePregnancy() { return {id:++nextRowId,year:'',gestationalAge:'',outcome:'',mode:'',sex:'',weight:'',institution:'',complications:''}; }
function makePrenatalVisit() { return {id:++nextRowId,timing:'',date:'',details:'',aogMode:''}; }
function makeProcedureEvent() { return {id:++nextRowId,age:'',type:'',institution:'',details:''}; }
function makeObFormatLogs() { return {obstetricHistory:[makePregnancy()],prenatalVisits:[makePrenatalVisit()],procedureEvents:[makeProcedureEvent()],obProcedureSelections:[]}; }
function makeSavedCaseId() { return globalThis.crypto?.randomUUID?.()||`case-${Date.now()}-${Math.random().toString(36).slice(2,10)}`; }
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
function formatObPrenatalRows(rows, data) {
  const utzWeeks=data.firstUtzAogWeeks;
  const utzDays=data.firstUtzAogDays;
  const useUtz=data.useUtzDating==='yes';
  return rows.map(row=>{
    const details=clean(row.details);
    const date=clean(row.date);
    const timing=clean(row.timing);
    if(date) {
      if(row.aogMode==='manual')return `AT ${[timing||formatDate(date),details].filter(Boolean).join(' — ')}`;
      const aog=useUtz?calculateUtzAog(date,data.firstUtzDate,utzWeeks,utzDays):calculateLmpAog(data.lmp,date);
      return `AT ${[aog?`${aog} AOG (${useUtz?'UTZ':'LMP'})`:formatDate(date),details].filter(Boolean).join(' — ')}`;
    }
    if(!timing&&!details)return '';
    return `AT ${[timing,details].filter(Boolean).join(' — ')}`;
  }).filter(Boolean).join('\n\n');
}

function buildNewMom(data) {
  const clock = value => {
    if (!value) return '';
    const [hourText, minute='00'] = value.split(':');
    const hour = Number(hourText);
    return Number.isNaN(hour) ? value : `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'pm' : 'am'}`;
  };
  return [
    '‼️ NEW MOM ‼️', '', clean(data.newMomName), clean(data.newMomAog), clean(data.newMomObScore), clean(data.newMomMpd),
    `OB: ${clean(data.newMomOb)}`, `Pedia: ${clean(data.newMomPedia)}`, '',
    `IE: ${clock(data.newMomIeTime)}`, clean(data.newMomDilation), clean(data.newMomEffacement), clean(data.newMomRupture),
    clean(data.newMomPosition), clean(data.newMomConsistency), clean(data.newMomStation), '',
    `SE: ${clean(data.newMomSe)}`, '', `FH ${clean(data.newMomFundalHeight)}`, `EFW ${clean(data.newMomEfw)}`,
    `FHT ${clean(data.newMomFht)}`, '', `Plan: ${clean(data.newMomPlan)}`
  ].join('\n').replace(/\s+$/, '');
}

function buildOb(data, obstetricHistory, prenatalVisits, procedureEvents, procedureSelections=[]) {
  if (data.obFormat==='newMom') return buildNewMom(data);
  return buildObTemplate(data, obstetricHistory, prenatalVisits, procedureEvents, procedureSelections);
}

function buildObTemplate(data, obstetricHistory, prenatalVisits, procedureEvents, procedureSelections=[]) {
  const dateTime=formatDateTime(data.ccDateTime);
  const ccOutput=[clean(data.cc),dateTime?`(${dateTime})`:'' ].filter(Boolean).join(' ');
  const legacyFlows={'Light':'Lightly soaked','Lightly soaked':'Lightly soaked','Moderate':'Moderately soaked','Moderately soaked':'Moderately soaked','Moderate, regular pad':'Moderately soaked','Heavy':'Fully soaked','Fully soaked':'Fully soaked'};
  const flow=legacyFlows[clean(data.menstrualSoak)]||clean(data.menstrualSoak);
  const amount=[clean(data.menstrualAmount)&&`${clean(data.menstrualAmount)} pads/day`,flow&&`${flow} flow`].filter(Boolean).join(', ');
  const regularity=clean(data.menstrualI);
  const associatedSymptoms=clean(data.menstrualAssociated);
  const symptoms=[data.mDysmenorrhea==='yes'&&!/\bdysmenorrhea\b/i.test(associatedSymptoms)?'Dysmenorrhea':'',associatedSymptoms].filter(Boolean).join(', ');
  const partners=[clean(data.sexualPartnersQty),clean(data.sexualPartnersGender)].filter(Boolean).join(', ');
  const contraception=data.sexualC2==='Other'?clean(data.sexualContraceptiveOther):clean(data.sexualC2);
  const pap=[formatYear(data.sexualP2),data.sexualPapFinding&&data.sexualPapFinding!=='Not stated'?clean(data.sexualPapFinding):''].filter(Boolean).join(', ');
  const sti=data.sexualS==='History'?`History - ${clean(data.sexualStiDetails)}`:clean(data.sexualS);
  const pmh=Array.isArray(data.pmhSelections)?data.pmhSelections:[];
  const procedures=procedureEvents.map(row=>[clean(row.age),clean(row.type),clean(row.institution),clean(row.details)].filter(Boolean).join(' — ')).filter(Boolean);
  const pmhRows=[pmh.includes('None')?'None':pmh.join(', '),...procedureSelections,...procedures.map(row=>`- ${row}`)].filter(Boolean);
  const vaccines=[['COVID',data.vaccineCovid],['Influenza',data.vaccineFlu],['Pneumococcal',data.vaccinePneumococcal],['Tetanus / TT',data.vaccineTt],['Tdap',data.vaccineTdap],['Booster',data.vaccineBooster]].filter(([label,detail])=>(Array.isArray(data.immunizationSelections)&&data.immunizationSelections.includes(label))||clean(detail)).map(([label,detail])=>`${label}: ${clean(detail)}`);
  const flags=Array.isArray(data.allergyFlags)?data.allergyFlags:[];
  const allergy=flags.includes('No known allergies')?'None':flags.includes('Known allergy')?(clean(data.allergies)||'Known allergies'):data.allergyStatus==='None'?'None':data.allergyStatus==='Unknown'?'Unknown':clean(data.allergies);
  const social=[allergy?labeled('FOOD AND DRUG ALLERGIES',allergy):'',...vaccines,clean(data.smoking)?`(${data.smoking==='No'?'-':'+'}) Smoking`:'',clean(data.alcohol)?`(${data.alcohol==='No'?'-':'+'}) Alcohol${clean(data.alcoholDetails)?` — ${clean(data.alcoholDetails)}`:''}`:'',clean(data.illicitDrugUse)?`(${data.illicitDrugUse==='No'?'-':'+'}) Illicit drug use`:''].filter(Boolean);
  const family=obFamilyOrder.map(([key,label])=>{const relation=data[`family_${key}`];if(data.familyHistoryNone==='yes'||relation==='None')return `(-) ${label.toUpperCase()}`;if(!relation)return '';const detail=key==='Cancer'?clean(data.family_CancerDetail):'';return `(+) ${label.toUpperCase()} - ${[detail,relation].filter(Boolean).join(', ')}`;}).filter(Boolean);
  const abdomen=data.obFormat==='gynecology'?[clean(data.gyneAbdominalExam)].filter(Boolean):[clean(data.abdomenAppearance),clean(data.fundalHeight)&&`FH ${clean(data.fundalHeight)} cm`,clean(data.fht)&&`FHT ${clean(data.fht)}`,clean(data.efw)&&`EFW ${clean(data.efw)} g`].filter(Boolean);
  const l2=[data.leopoldL2MR&&`MR - ${clean(data.leopoldL2MR)}`,data.leopoldL2ML&&`ML - ${clean(data.leopoldL2ML)}`].filter(Boolean).join('; ')||clean(data.leopoldL2);
  const leopolds={L1:data.leopoldL1,L2:l2,L3:data.leopoldL3,L4:data.leopoldL4};
  const score=calculateBishopScore(data);
  const ie=[data.bishopDilation&&`Dilation: ${data.bishopDilation}`,data.bishopEffacement&&`Effacement: ${data.bishopEffacement}`,data.bishopStation&&`Station: ${data.bishopStation}`,data.bishopConsistency&&`Consistency: ${data.bishopConsistency}`,data.bishopPosition&&`Position: ${data.bishopPosition}`,score!==null&&`Bishop score: ${score}/13`].filter(Boolean).join('; ')||clean(data.ieSummary);
  const patientDetails=obTextFields.slice(0,8).map(([key,label])=>labeled(label,data[key])).join('\n');
  const menstrualHistory=titled('MENSTRUAL HISTORY',[['M',data.menstrualM],['I',regularity],['D',data.menstrualD],['A',amount],['S',symptoms]]);
  const sexualHistory=titled('SEXUAL HISTORY',[['C',data.sexualC1],['P',partners],['C',contraception],['P',pap],['S',sti]]);
  const sections=data.obFormat==='gynecology' ? [
    patientDetails,
    labeled('CC',ccOutput),
    `HPI:\n${clean(data.hpi)}`,
    menstrualHistory,
    sexualHistory,
    `OB HISTORY\n\n${labeled('LMP',formatDate(data.lmp))}\n${labeled('PMP',formatDate(data.pmp))}\n${labeled('EDD',calculateEdd(data.lmp))}`,
    `OBSTETRICAL HISTORY\n${formatPregnancyRows(obstetricHistory)}`,
    `PRENATAL HISTORY\n${data.obFormat==='gynecology'?'':formatObPrenatalRows(prenatalVisits,data)}`,
    `PAST MEDICAL HISTORY:\n${pmhRows.join('\n')}`,
    `CURRENT MEDICATIONS:\n${clean(data.medications)}`,
    `PERSONAL AND SOCIAL HISTORY\n${social.join('\n')}`,
    `FAMILY MEDICAL HX:\n${family.join('\n')}`,
    `ABDOMINAL EXAM:\n${abdomen.join(', ')}`,
    `ICUAD:\nI - ${clean(data.peIntroitus)}\nC - ${clean(data.peCervix)}\nU - ${clean(data.peUterus)}\nA - ${clean(data.peAdnexa)}\nD - ${clean(data.peDischarge)}`,
    `IE SUMMARY: ${ie}`,
    `ADMITTING DIAGNOSIS:\n${clean(data.admittingDiagnosis)}`,
    titled('VITAL SIGNS',[['BP',data.vsBp],['HR',data.vsHr],['RR',data.vsRr],['TEMP',data.vsTemp],['PPW',data.vsPpw],['WT',data.vsWt],['HT',data.vsHt]])
  ] : [
    patientDetails,
    labeled('Chief Complaint',ccOutput),
    `HPI:\n${clean(data.hpi)}`,
    menstrualHistory,
    sexualHistory,
    titled('OB HISTORY',[['LMP',formatDate(data.lmp)],['PMP',formatDate(data.pmp)],['EDD',calculateEdd(data.lmp)]]),
    `OBSTETRICAL HISTORY:\n${formatPregnancyRows(obstetricHistory)}`,
    `PRENATAL HISTORY:\n${formatObPrenatalRows(prenatalVisits,data)}`,
    `PAST MEDICAL HISTORY:\n${pmhRows.join('\n')}`,
    `CURRENT MEDICATIONS:\n${clean(data.medications)}`,
    `PERSONAL AND SOCIAL HISTORY:\n${social.join('\n')}`,
    `FAMILY MEDICAL HX:\n${family.join('\n')}`,
    `ABDOMINAL EXAM:\n${abdomen.join(', ')}`,
    `LEOPOLDS MANEUVERS\n${['L1','L2','L3','L4'].map(label=>`${label}: ${clean(leopolds[label])}`).join('\n')}`,
    `IE SUMMARY: ${ie}`,
    `ADMITTING DIAGNOSIS:\n${clean(data.admittingDiagnosis)}`,
    titled('VITAL SIGNS',[['BP',data.vsBp],['HR',data.vsHr],['RR',data.vsRr],['TEMP',data.vsTemp],['PPW',data.vsPpw],['WT',data.vsWt],['HT',data.vsHt]])
  ];
  return `\u200B${uppercaseOutputLabels(sections.join('\n\n').replace(/\n{3,}/g,'\n\n').trim())}`;
}

function buildPedia(data, procedureEvents=[], prenatalVisits=[], procedureSelections=[], obstetricHistory=[]) {
  const pediaPmh=Array.isArray(data.pmh)?data.pmh:[];
  const pmhOutput=pediaPmh.includes('None')?'None':pediaPmh.join(', ');
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
    titled('', [['OB score',data.obScore],['LMP',formatDate(data.lmp)],['AOG by LMP',data.aogLmp],['AOG by UTZ',data.aogUtz],['EDD',calculateEdd(data.lmp)],['FH',data.fh],['EFW',data.efw],['First PNC',data.firstPnc],['Mat BT',data.maternalBt],['Pat BT',data.paternalBt],['HbsAg',data.hbsag],['HIV',data.hiv],['Syphilis',data.syphilis],['Papsmear',data.papsmear],['CAS',data.cas],['GBS',data.gbs],['OGTT',data.ogtt]]).replace(/^\n/, ''),
    `Prenatal vitamins/meds:\n${clean(data.prenatalMeds)}`,
    `Maternal Illness/Complications:\nHypertension: ${clean(data.maternalHtn)}\nDiabetes: ${clean(data.maternalDiabetes)}\nAsthma: ${clean(data.maternalAsthma)}`,
    `Pertinent Prenatal Hx:\n${formatPrenatalRows(prenatalVisits)}`,
    `Latest Ultrasound:\n${clean(data.latestUs)}`,
    `OB Hx:\n${formatPregnancyRows(obstetricHistory)}`,
    `Past Medical History:\n${pmhOutput}`,
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

function Field({ label, value, onChange, multiline=false, hint='', placeholder='', type='text', options=null, disabled=false, inputMode }) {
  const props = { value, onChange:e=>onChange(e.target.value), placeholder, 'aria-label':label, type, disabled, inputMode };
  return <label className={`field ${multiline?'wide':''}`}><span>{label}</span>{multiline?<textarea {...props} rows={label==='HPI'?5:3}/>:options?<select {...props}>{options.map(([option,labelText])=><option key={option} value={option}>{labelText}</option>)}</select>:type==='date'?<DateInput value={value} onChange={onChange} ariaLabel={label} disabled={disabled}/>:<input {...props}/ >}{hint&&<small>{hint}</small>}</label>;
}
function prescriptionDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${Number(month)}/${Number(day)}/${year}` : value;
}
function PrescriptionPadPreview({ values }) {
  const pad = (value, index) => <div className={`rx-pad-page rx-print-copy rx-print-copy-${index+1}`} key={index}>
      <img src={`${import.meta.env.BASE_URL}ucmed-rx-pad.jpg`} alt="Blank UCMed prescription pad" />
      <div className="rx-overlay rx-patient-name">{value.name}</div>
      <div className="rx-overlay rx-date">{prescriptionDate(value.date)}</div>
      <div className="rx-overlay rx-address">{value.address}</div>
      <div className="rx-overlay rx-age">{value.age}</div>
      <div className="rx-overlay rx-gender">{value.gender}</div>
      <div className="rx-overlay rx-instructions">{value.prescription}</div>
      <div className="rx-overlay rx-prescriber">{value.prescriber}</div>
      <div className="rx-overlay rx-license">{value.license}</div>
      <div className="rx-overlay rx-ptr">{value.ptr}</div>
      <div className="rx-overlay rx-s2">{value.s2}</div>
      <div className="rx-overlay rx-tin">{value.tin}</div>
  </div>;
  return <div className="rx-print-area" aria-label="UCMed prescription preview">
    <div className="rx-screen-preview">{values.map(pad)}</div>
    <div className="rx-print-row" aria-hidden="true">{values.map(pad)}</div>
  </div>;
}
function PrescriptionForm({ value, index, onChange }) {
  const field = key => next => onChange(index, key, next);
  return <div className="rx-entry-form">
    <h3>Prescription {index+1}</h3>
    <Section title="Patient information"><div className="grid two"><Field label="Patient name" value={value.name} onChange={field('name')}/><Field label="Date" type="date" value={value.date} onChange={field('date')}/><Field label="Address" value={value.address} onChange={field('address')}/><Field label="Age" type="number" value={value.age} onChange={field('age')}/><Field label="Gender" value={value.gender} onChange={field('gender')} options={[["","Select"],["Male","Male"],["Female","Female"]]}/></div></Section>
    <Section title="Prescription"><Field label="Medication and instructions" multiline value={value.prescription} onChange={field('prescription')} placeholder="Enter the exact prescription text, including medicine, strength, dose, route, frequency, duration, and quantity." hint="This text appears on this pad only."/></Section>
    <Section title="Prescriber information"><div className="grid two"><Field label="Physician name" value={value.prescriber} onChange={field('prescriber')}/><Field label="License number" value={value.license} onChange={field('license')}/><Field label="PTR number" value={value.ptr} onChange={field('ptr')}/><Field label="S2 number" value={value.s2} onChange={field('s2')}/><Field label="TIN" value={value.tin} onChange={field('tin')}/></div></Section>
  </div>;
}
function Toggle({label,checked,onChange}) { return <label className="toggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked?'yes':'')}/><span className="toggle-box"/><span>{label}</span></label>; }
function CheckGroup({options,selected,onChange,exclusive=[]}) {
  const values=Array.isArray(selected)?selected:[];
  return <div className="check-grid">{options.map(option=><label className="toggle check-option" key={option}><input type="checkbox" checked={values.includes(option)} onChange={e=>{let next;if(e.target.checked)next=exclusive.includes(option)?[option]:[...values.filter(value=>!exclusive.includes(value)),option];else next=values.filter(value=>value!==option);onChange(next);}}/><span className="toggle-box"/><span>{option}</span></label>)}</div>;
}
function FamilyRow({label,value,onChange}) {
  const hasPaternal=value==='Paternal'||value==='Both';
  const hasMaternal=value==='Maternal'||value==='Both';
  return <div className="family-checkbox-row"><strong>{label}</strong><Toggle label="Paternal" checked={hasPaternal} onChange={checked=>onChange(checked?(hasMaternal?'Both':'Paternal'):(hasMaternal?'Maternal':''))}/><Toggle label="Maternal" checked={hasMaternal} onChange={checked=>onChange(checked?(hasPaternal?'Both':'Maternal'):(hasPaternal?'Paternal':''))}/><Toggle label="Both" checked={value==='Both'} onChange={checked=>onChange(checked?'Both':'')}/></div>;
}
function interviewGroup(title) {
  if (['Patient information','New mom details'].includes(title)) return 0;
  if (['Chief complaint & present illness','IE & SE'].includes(title)) return 1;
  if (['Menstrual history','Fetal assessment & plan'].includes(title)) return 2;
  if (title==='Sexual history') return 3;
  if (['Obstetric history','Prenatal visit history'].includes(title)) return 4;
  if (['Past medical history','Previous admissions or surgeries','Current medications'].includes(title)) return 5;
  if (['Personal & social history','Immunizations','Family history'].includes(title)) return 6;
  if (['Vital signs','Physical examination'].includes(title)) return 7;
  return null;
}
function Section({ title, description, children }) {
  const interview = useContext(InterviewContext);
  const group = interviewGroup(title);
  return <section className="form-section" hidden={interview?.view==='prenatal'?title!=='Prenatal visit history':interview?.enabled && group!==null && group!==interview.step} data-interview-group={group}><div className="section-title"><h2>{title}</h2>{description&&<p>{description}</p>}</div><div className="fields">{children}</div></section>;
}
function ConfirmationModal({title,message,confirmLabel='Confirm',onCancel,onConfirm}) {
  useEffect(()=>{
    const onKeyDown=event=>{if(event.key==='Escape')onCancel();};
    window.addEventListener('keydown',onKeyDown);
    return ()=>window.removeEventListener('keydown',onKeyDown);
  },[onCancel]);
  return <div className="confirm-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onCancel();}}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><div className="confirm-icon" aria-hidden="true">!</div><div className="confirm-content"><h2 id="confirm-title">{title}</h2><p id="confirm-message">{message}</p><div className="confirm-actions"><button type="button" className="confirm-cancel" onClick={onCancel}>Cancel</button><button type="button" className="confirm-destructive" onClick={onConfirm}>{confirmLabel}</button></div></div></section></div>;
}
function EditableLogTable({title,description,rows,setRows,createRow,columns,rowLabel,addLabel,kind='events'}) {
  const [pendingDelete,setPendingDelete]=useState(null);
  const interview=useContext(InterviewContext);
  const interviewStep=kind==='prenatal'||kind==='pregnancies'?4:5;
  const changeCell=(id,key,value)=>setRows(items=>items.map(item=>item.id===id?{...item,[key]:value}:item));
  return <><div className={`editable-log editable-log-${kind}`} hidden={interview?.view==='prenatal'?kind!=='prenatal':interview?.enabled&&interview.step!==interviewStep}><div className="editable-log-header"><div><h3>{title}</h3>{description&&<p>{description}</p>}</div><button type="button" onClick={()=>setRows(items=>[...items,createRow()])}>＋ {addLabel}</button></div><div className="editable-log-scroll"><table><thead><tr><th>{rowLabel}</th>{columns.map(column=><th key={column.key}>{column.label}</th>)}<th>Action</th></tr></thead><tbody>{rows.map((row,index)=>{const currentPregnancy=rowLabel==='G'&&row.outcome==='Current pregnancy';return <tr key={row.id}><th scope="row">{rowLabel==='G'?`G${index+1}`:index+1}</th>{columns.map(column=><td key={column.key}>{column.render?column.render(row,index,(key,value)=>changeCell(row.id,key,value)):column.options?<select aria-label={`${rowLabel==='G'?`G${index+1}`:`Event ${index+1}`} ${column.label}`} disabled={currentPregnancy&&column.key!=='year'&&column.key!=='outcome'} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}>{column.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:column.multiline?<textarea aria-label={`${rowLabel==='G'?`G${index+1}`:`Visit ${index+1}`} ${column.label}`} disabled={currentPregnancy&&column.key!=='year'} rows={2} placeholder={column.placeholder||''} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}/>:column.type==='date'?<DateInput table disabled={currentPregnancy&&column.key!=='year'} ariaLabel={`${rowLabel==='G'?`G${index+1}`:`Visit ${index+1}`} ${column.label}`} value={row[column.key]||''} onChange={value=>{changeCell(row.id,column.key,value);if(kind==='prenatal'&&!value)changeCell(row.id,'aogMode','manual');}}/>:<input aria-label={`${rowLabel==='G'?`G${index+1}`:`Event ${index+1}`} ${column.label}`} disabled={currentPregnancy&&column.key!=='year'} type={column.type||'text'} placeholder={column.placeholder||''} value={row[column.key]||''} onChange={event=>changeCell(row.id,column.key,event.target.value)}/>}</td>)}<td className="editable-log-action"><button type="button" aria-label={`Remove ${rowLabel==='G'?`pregnancy G${index+1}`:`event ${index+1}`}`} title="Remove row" onClick={()=>setPendingDelete(row)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 3v7m4-7v7"/></svg></button></td></tr>})}</tbody></table></div></div>{pendingDelete&&<ConfirmationModal title="Remove this entry?" message="This entry will be removed from the history log." confirmLabel="Remove entry" onCancel={()=>setPendingDelete(null)} onConfirm={()=>{setRows(items=>items.filter(item=>item.id!==pendingDelete.id));setPendingDelete(null);}}/>}</>;
}

export default function App() {
  const [savedDraft] = useState(() => {
    const draft = readLocalDraft();
    reserveSavedRowIds(draft);
    return draft;
  });
  const [tab,setTab] = useState(()=>savedDraft.tab === 'rx' && !SHOW_PRESCRIPTION_TAB ? 'ob' : savedDraft.tab || 'ob');
  const [obInterview,setObInterview] = useState(false);
  const [obPrenatalTab,setObPrenatalTab] = useState(false);
  const [obInterviewStep,setObInterviewStep] = useState(0);
  const [ob,setOb] = useState(()=>({...blank(obFields),...(savedDraft.ob || {})}));
  const [obFormatDrafts,setObFormatDrafts] = useState(()=>savedDraft.obFormatDrafts||{});
  const [obFormatLogs,setObFormatLogs] = useState(()=>savedDraft.obFormatLogs||{});
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
  const [rxPads,setRxPads] = useState(()=>[
    {...EMPTY_RX_DRAFT,...((savedDraft.rxPads && savedDraft.rxPads[0]) || savedDraft.rx || {})},
    {...EMPTY_RX_DRAFT,...((savedDraft.rxPads && savedDraft.rxPads[1]) || {})}
  ]);
  const [copied,setCopied] = useState(false);
  const [confirmation,setConfirmation] = useState(null);
  const [savedCases,setSavedCases] = useState(()=>Array.isArray(savedDraft.savedCases)?savedDraft.savedCases:[]);
  const [activeSavedCaseId,setActiveSavedCaseId] = useState(()=>savedDraft.activeSavedCaseId||null);
  const [savedCasesOpen,setSavedCasesOpen] = useState(false);
  const [saveCaseOpen,setSaveCaseOpen] = useState(false);
  const [saveCaseName,setSaveCaseName] = useState('');
  const [caseFeedback,setCaseFeedback] = useState('');
  const [caseImportError,setCaseImportError] = useState('');
  const importFileRef=useRef(null);
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        tab, ob, obFormatDrafts, obFormatLogs, obstetricHistory, prenatalVisits, procedureEvents, obProcedureSelections,
        entProcedureEvents, entProcedureSelections, pediaProcedureEvents, pediaProcedureSelections,
        pediaPrenatalVisits, pediaObstetricHistory, ent, pedia, rxPads, savedCases, activeSavedCaseId
      }));
    } catch {
      // The form remains usable if browser storage is unavailable or full.
    }
  }, [tab, ob, obFormatDrafts, obFormatLogs, obstetricHistory, prenatalVisits, procedureEvents, obProcedureSelections,
    entProcedureEvents, entProcedureSelections, pediaProcedureEvents, pediaProcedureSelections,
    pediaPrenatalVisits, pediaObstetricHistory, ent, pedia, rxPads, savedCases, activeSavedCaseId]);
  const data = tab==='ob'?ob:tab==='pedia'?pedia:ent;
  const setData = tab==='ob'?setOb:tab==='pedia'?setPedia:setEnt;
  const interviewSteps = ob.obFormat==='newMom' ? ['New mom details','IE & SE','Fetal assessment & plan','Review & copy'] : ob.obFormat==='gynecology' ? ['Patient information','Chief complaint & HPI','Menstrual history','Sexual history','Obstetric history','Medical history','Personal, social & family history','Vitals & examination','Review & copy'] : ['Patient information','Chief complaint & HPI','Menstrual history','Sexual history','Obstetric & prenatal history','Medical history','Personal, social & family history','Vitals & examination','Review & copy'];
  const interviewReviewStep = interviewSteps.length-1;
  const output = useMemo(()=>{
    const message=tab==='rx'?'':tab==='ob'?buildOb(ob,obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections):tab==='pedia'?buildPedia(pedia,pediaProcedureEvents,pediaPrenatalVisits,pediaProcedureSelections,pediaObstetricHistory):buildEnt(ent,entProcedureEvents,entProcedureSelections);
    return message.replace(/\r\n?/g,'\n').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim();
  },[tab,ob,obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections,entProcedureEvents,entProcedureSelections,pedia,pediaProcedureEvents,pediaPrenatalVisits,pediaProcedureSelections,pediaObstetricHistory,ent]);
  function update(key,value) {
    setData(current=>{
      const next={...current,[key]:value};
      if(tab==='ob'&&ob.obFormat==='gynecology'&&key==='obScore') {
        const match=String(value).match(/^\s*G\s*(\d+)\s*P\s*(\d+)(?:\s*\(\s*(\d)(\d)(\d)(\d)\s*\))?/i);
        if(match) {
          next.gravidaCount=match[1];
          next.parityCount=match[2];
          if(match[3]!==undefined)[['termCount',match[3]],['pretermCount',match[4]],['abortionCount',match[5]],['liveBirthCount',match[6]]].forEach(([countKey,count])=>{next[countKey]=count;});
        }
      }
      return next;
    });
    setCopied(false);
  }
  function updateRx(index,key,value) { setRxPads(current=>current.map((pad,padIndex)=>padIndex===index?{...pad,[key]:value}:pad)); }
  function updateRow(setRows,id,key,value) { setRows(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row)); setCopied(false); }
  function switchObFormat(format) {
    const currentFormat=ob.obFormat||'obstetrics';
    setObFormatDrafts(current=>({...current,[currentFormat]:ob}));
    setObFormatLogs(current=>({...current,[currentFormat]:{obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections}}));
    const nextData=obFormatDrafts[format]||{...blank(obFields),obFormat:format};
    const nextLogs=obFormatLogs[format]||makeObFormatLogs();
    setOb({...blank(obFields),...nextData,obFormat:format});
    setObstetricHistory(nextLogs.obstetricHistory||[makePregnancy()]);
    setPrenatalVisits(nextLogs.prenatalVisits||[makePrenatalVisit()]);
    setProcedureEvents(nextLogs.procedureEvents||[makeProcedureEvent()]);
    setObProcedureSelections(nextLogs.obProcedureSelections||[]);
    setObInterviewStep(0);
    setObPrenatalTab(false);
    setObInterview(false);
    setCopied(false);
  }
  async function copyOutput() {
    let copied=false;
    const plainText=String(output).replace(/\r\n?/g,'\n');
    try {
      if(navigator.clipboard?.write && typeof ClipboardItem!=='undefined' && typeof Blob!=='undefined') {
        const plainItem=new ClipboardItem({'text/plain':new Blob([plainText],{type:'text/plain'})});
        await navigator.clipboard.write([plainItem]);
        copied=true;
      } else if(navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
        copied=true;
      }
    } catch { /* Use the selection-based plain-text fallback when clipboard access is unavailable. */ }
    if(!copied) {
      const area=document.createElement('textarea');
      area.value=plainText;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      area.style.pointerEvents='none';
      area.addEventListener('copy',event=>{if(!event.clipboardData)return;event.clipboardData.clearData();event.clipboardData.setData('text/plain',plainText);event.preventDefault();});
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0,area.value.length);
      try { copied=document.execCommand('copy'); } catch { copied=false; }
      area.remove();
    }
    if(copied) {
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1800);
    }
  }
  function clearForm() {
    setActiveSavedCaseId(null);
    if(tab==='rx') setRxPads([{...EMPTY_RX_DRAFT},{...EMPTY_RX_DRAFT}]);
    else if(tab==='ob') {
      const format=ob.obFormat||'obstetrics';
      const cleared={...blank(obFields),obFormat:format};
      const emptyLogs=makeObFormatLogs();
      setOb(cleared);
      setObFormatDrafts(current=>({...current,[format]:cleared}));
      setObstetricHistory(emptyLogs.obstetricHistory);
      setPrenatalVisits(emptyLogs.prenatalVisits);
      setProcedureEvents(emptyLogs.procedureEvents);
      setObProcedureSelections(emptyLogs.obProcedureSelections);
      setObFormatLogs(current=>({...current,[format]:emptyLogs}));
    } else {
      setData(blank(tab==='pedia'?pediaFields:entFields));
      if(tab==='pedia'){setPediaProcedureEvents([makeProcedureEvent()]);setPediaProcedureSelections([]);setPediaPrenatalVisits([makePrenatalVisit()]);setPediaObstetricHistory([makePregnancy()]);}
      else {setEnt({...blank(entFields),entFormat:'blotter',pmhSelections:[]});setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);}
    }
    setCopied(false);
  }
  function captureCurrentCase() {
    if(tab==='ob') return {tab,format:ob.obFormat||'obstetrics',patientName:ob.obFormat==='newMom'?clean(ob.newMomName):clean(ob.name),payload:{ob,obstetricHistory,prenatalVisits,procedureEvents,obProcedureSelections}};
    if(tab==='pedia') return {tab,format:'pedia',patientName:clean(pedia.motherName),payload:{pedia,pediaProcedureEvents,pediaProcedureSelections,pediaPrenatalVisits,pediaObstetricHistory}};
    return {tab:'ent',format:ent.entFormat||'blotter',patientName:clean(ent.name),payload:{ent,entProcedureEvents,entProcedureSelections}};
  }
  function caseFileName(record) {
    const safeName=(record.name||'patient-case').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'patient-case';
    return `${safeName}.medtools.json`;
  }
  async function exportCase(record) {
    const fileName=caseFileName(record);
    const contents=JSON.stringify({app:'med-clerk-tools',kind:'med-clerk-patient-case',schemaVersion:1,exportedAt:new Date().toISOString(),case:record},null,2);
    const blob=new Blob([contents],{type:'application/json'});
    const file=new File([blob],fileName,{type:'application/json'});
    if(navigator.share&&navigator.canShare?.({files:[file]})) {
      try { await navigator.share({files:[file],title:record.name||'Patient case'}); } catch { /* A dismissed share sheet leaves the local case unchanged. */ }
      return;
    }
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=fileName;
    link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function saveCurrentCase() {
    const snapshot=captureCurrentCase();
    const existing=savedCases.find(record=>record.id===activeSavedCaseId&&record.tab===snapshot.tab&&record.format===snapshot.format);
    const id=existing?.id||makeSavedCaseId();
    const record={...snapshot,id,name:saveCaseName.trim()||snapshot.patientName||'Untitled case',updatedAt:new Date().toISOString()};
    setSavedCases(current=>existing?current.map(item=>item.id===id?record:item):[record,...current]);
    setActiveSavedCaseId(id);
    setSaveCaseOpen(false);
    setCaseFeedback(`Saved “${record.name}” in this browser.`);
  }
  function loadSavedCase(record) {
    const payload=record.payload||{};
    reserveSavedRowIds(payload);
    if(record.tab==='ob') {
      const format=record.format||payload.ob?.obFormat||'obstetrics';
      const nextOb={...blank(obFields),...(payload.ob||{}),obFormat:format};
      const nextLogs={obstetricHistory:payload.obstetricHistory||[makePregnancy()],prenatalVisits:payload.prenatalVisits||[makePrenatalVisit()],procedureEvents:payload.procedureEvents||[makeProcedureEvent()],obProcedureSelections:payload.obProcedureSelections||[]};
      setOb(nextOb);setObstetricHistory(nextLogs.obstetricHistory);setPrenatalVisits(nextLogs.prenatalVisits);setProcedureEvents(nextLogs.procedureEvents);setObProcedureSelections(nextLogs.obProcedureSelections);
      setObFormatDrafts(current=>({...current,[format]:nextOb}));setObFormatLogs(current=>({...current,[format]:nextLogs}));
      setTab('ob');setObInterview(false);setObPrenatalTab(false);setObInterviewStep(0);
    } else if(record.tab==='pedia') {
      setPedia({...blank(pediaFields),...(payload.pedia||{})});setPediaProcedureEvents(payload.pediaProcedureEvents||[makeProcedureEvent()]);setPediaProcedureSelections(payload.pediaProcedureSelections||[]);setPediaPrenatalVisits(payload.pediaPrenatalVisits||[makePrenatalVisit()]);setPediaObstetricHistory(payload.pediaObstetricHistory||[makePregnancy()]);setTab('pedia');
    } else {
      setEnt({...blank(entFields),entFormat:record.format||'blotter',...(payload.ent||{})});setEntProcedureEvents(payload.entProcedureEvents||[makeProcedureEvent()]);setEntProcedureSelections(payload.entProcedureSelections||[]);setTab('ent');
    }
    setActiveSavedCaseId(record.id);
    setSavedCasesOpen(false);
    setCaseFeedback(`Loaded “${record.name}”.`);
    setCopied(false);
  }
  async function importCaseFile(event) {
    const file=event.target.files?.[0];
    if(!file)return;
    try {
      const imported=JSON.parse(await file.text());
      const record=imported?.case;
      const validEnvelope=imported?.app==='med-clerk-tools'&&imported?.kind==='med-clerk-patient-case'&&imported?.schemaVersion===1;
      const validPayload=record&&['ob','pedia','ent'].includes(record.tab)&&record.payload&&((record.tab==='ob'&&record.payload.ob)||(record.tab==='pedia'&&record.payload.pedia)||(record.tab==='ent'&&record.payload.ent));
      if(!validEnvelope||!validPayload)throw new Error('This file is not a supported Med Clerk Tools patient case.');
      const importedRecord={...record,id:makeSavedCaseId(),name:String(record.name||'Imported case'),updatedAt:record.updatedAt||imported.exportedAt||new Date().toISOString()};
      setSavedCases(current=>[importedRecord,...current]);
      setSavedCasesOpen(true);
      setCaseImportError('');
      setCaseFeedback(`Imported “${importedRecord.name}”. Choose Load to open it.`);
    } catch(error) {
      setCaseImportError(error instanceof Error?error.message:'Could not read this case file.');
      setSavedCasesOpen(true);
    } finally {
      event.target.value='';
    }
  }
  function loadSample() {
    setActiveSavedCaseId(null);
    if(tab==='ent'&&ent.entFormat==='trauma') { setEnt({...blank(entFields),entFormat:'trauma',date:'2026-10-03',traumaTimeReceived:'22:32',name:'Papilitan, Helton Lucero',age:'46',sex:'M',hospitalNumber:'2016933619',reasonReferral:'Evaluation and management',workingImpression:'Multiple Physical Injuries 2* to Alleged Assault\n1. T/C Mild traumatic brain injury\n2. T/C Traumatic Brain Injury\n3. T/C Facial Bone Fracture\n4. Periorbital Hematoma, Left\n5. Abrasion, Temporal Area, Left',noi:'Alleged Assault',toi:'23:55',doi:'2026-10-02',poi:'San Juan',injuryNarrative:'Patient was drinking with his neighbors when another neighbor not part of their group suddenly attacked and hit him using a wood “dos por dos” on the left side of his head once, sustaining left periorbital ecchymosis, left parietooccipital area tenderness, and abrasions on the left frontotemporal area. Patient reported headache, PS 5/10, epistaxis, and hematemesis about one cup in volume once. No loss of consciousness, blurring of vision, or otorrhagia.',pmhSelections:['None'],immunizationSelections:['Childhood Immunizations','COVID-19 vaccine'],pshSmoking:'Yes',pshAlcohol:'Yes',pshDrugs:'No',allergies:'None',medicationsNone:'yes',familyDiseasesNone:'yes',traumaSurvey:'Patient was seen in the ER, awake, alert, and conscious, not in respiratory distress.',traumaFindings:Object.fromEntries(traumaFindings.map(item=>[item,'-']))}); setEnt(v=>({...v,traumaFindings:{...v.traumaFindings,'Full EOM':'+'}}));setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);setCopied(false);return; }
    if(tab==='ent') { setEnt({...blank(entFields),entFormat:'complete',pmhSelections:['None'],immunizationSelections:['Childhood Immunizations','COVID-19 vaccine'],date:'2026-10-03',name:'SOLITORIO, KATHLEEN PALLER',age:'23',sex:'F',address:'Can-aga, Sibonga, Cebu',religion:'Roman Catholic',contact:'09986439571',cc:'Left sided pain (Face)',hpi:'1 month PTC, noted sudden onset of sharp, intermittent pain of her left tooth lasting for 1 hour occurring twice a day. PS 3/10. No associated fever, nausea, or vomiting. Self-medicated with Ponstan 500 mg PO OD with relief. No consults done.\n\n3 weeks PTC, noted recurrence of left-sided pain, now constant with PS 8/10, associated with swelling of the left side of face. No fever, nausea, or vomiting. Consulted a dentist and was prescribed Co-amoxiclav 625 mg BID for 7 days and Mefenamic Acid 500 mg with no relief.\n\n8 days PTC, worsening swelling, now erythematous, PS 9/10.\n\n2 days PTC, dentist requested panoramic x-ray. At Chong Hua ER, patient spat out about 10 mL of foul-smelling purulent discharge. Prescribed Ciprofloxacin, Clindamycin, Celecoxib, and Chlorhexidine. Due to minimal improvement, sought consult at our institution.',assessment:'',pshSmoking:'No',pshAlcohol:'No',pshDrugs:'No',allergies:'None',familyHtn:'',familyDm:'',familyAsthma:'Paternal',familyMalignancy:'',generalSurvey:'Patient was seen awake, alert, and conscious, not in respiratory distress.',peEyes:{'Full EOMs':'+','Subconjunctival hemorrhage':'-','Icteric sclerae':'-','Periorbital swelling':'-'},peHead:{'Normocephalic':'+','Lesions':'-','Swelling':'+','Facial avulsion':'-','Laceration':'-'},peEars:{'Otalgia':'-','Otorrhea':'-','Otorrhagia':'-','Deformities':'-','Tug test':'-','Tragus test':'-','Impacted cerumen':'-','Hearing loss':'-','Perforated tympanic membrane':'-','Foreign body':'-'},peNose:{'Patent nares':'+','Epistaxis':'-','Septal deviation':'-','Sinus tenderness':'-','Bloody discharge':'-','Foreign body':'-','Congestion':'-','Abrasions over bridge of nose':'-'},peMouth:{'Pink moist lips and oral mucosa':'+','Lesions':'-','Sublingual hematoma':'-','Enlarged submandibular gland':'-'},peThroatNeck:{'Trachea at midline':'+','Tenderness':'+','Erythema':'+','Swelling':'+','Palpable neck mass':'-','Left cervical lymphadenopathy':'-','Stridor':'-','Hoarseness':'-','Dysphagia':'-','Odynophagia':'-'}}); setEntProcedureEvents([makeProcedureEvent()]);setEntProcedureSelections([]);setCopied(false); return; }
    if(tab==='ob'&&ob.obFormat==='newMom') { setOb({...blank(obFields),obFormat:'newMom',newMomName:'CABAÑOG SHENIE',newMomAog:'37 6/7 weeks AOG by UTZ',newMomObScore:'G1P0',newMomMpd:'30/PD',newMomOb:'Dr. Taguba',newMomPedia:'House',newMomIeTime:'08:00',newMomDilation:'4cm',newMomEffacement:'60%',newMomRupture:'Ruptured, clear (07/19/26 7:10am)',newMomPosition:'Mid',newMomConsistency:'Med',newMomStation:'-3',newMomSe:'+pooling, clear',newMomFundalHeight:'33cm',newMomEfw:'3,100g',newMomFht:'140s',newMomPlan:'TF'}); setCopied(false); return; }
    if(tab==='ob'&&ob.obFormat==='gynecology') {
      setOb({...blank(obFields),obFormat:'gynecology',name:'Sample Patient',age:'32',mrn:'GYNE-SAMPLE',obScore:'G2P1 (1001)',obs:'G2P1 (1001)',religion:'Catholic',status:'Married',address:'Cebu City',occupation:'Teacher',cc:'Pelvic pain',hpi:'Three days PTA, noted intermittent lower abdominal pain. No fever, vomiting, or abnormal vaginal bleeding.',menstrualM:'13',menstrualI:'Regular',menstrualD:'5',menstrualAmount:'3',menstrualSoak:'Moderately soaked',mDysmenorrhea:'yes',menstrualAssociated:'Dysmenorrhea',sexualC1:'19',sexualPartnersQty:'1',sexualPartnersGender:'Male',sexualC2:'Condoms',sexualP2:'2024',sexualPapFinding:'Normal',sexualS:'None',lmp:'2026-10-12',pmp:'2026-09-14',pmhSelections:['None'],medications:'None',familyHistoryNone:'yes',gyneAbdominalExam:'Soft, non-distended, non-tender',peIntroitus:'Parous, no lesions',peCervix:'Closed, smooth, no CMT',peUterus:'Anteverted, non-tender',peAdnexa:'No palpable masses or tenderness',peDischarge:'No abnormal discharge',ieSummary:'Cervix closed, no CMT',admittingDiagnosis:'Evaluation of pelvic pain',vsBp:'118/76',vsRr:'16',vsHr:'78',vsTemp:'36.7',vsPpw:'54',vsWt:'58',vsHt:'158'});
      setObstetricHistory([Object.assign(makePregnancy(),{year:'2018',gestationalAge:'39 weeks',outcome:'Term',mode:'NSVD',sex:'Female',weight:'3100',institution:'Hospital'})]);
      setPrenatalVisits([makePrenatalVisit()]);
      setProcedureEvents([makeProcedureEvent()]);
      setCopied(false);
      return;
    }
    if(tab==='ob') {
      setOb({...blank(obFields),name:'Princess Mae Paglinawan',age:'28',mrn:'498244',obs:'G1P0',religion:'Catholic',address:'Catmon, Cebu',occupation:'School Teacher',cc:'Elevated Blood Pressure',hpi:'Two days PTA, patient came to scheduled prenatal visit with AP. Vital signs revealed elevated BP 150/100; repeated BP 140/100. No associated symptoms noted: no blurring of vision, dizziness, nausea, vomiting, or headache. She was advised for admission.',menstrualM:'15 y/o',menstrualI:'Regular',menstrualD:'4 days',menstrualAmount:'4',menstrualSoak:'Moderately soaked',mDysmenorrhea:'yes',sexualC1:'18',sexualPartnersQty:'2',lmp:'2025-09-26',edd:'2026-07-03',pmhSelections:['None'],immunizationSelections:['COVID','Booster','Tetanus / TT'],vaccineCovid:'Sinovac x 2 doses',vaccineBooster:'Pfizer',vaccineTt:'x 2 doses','family_Hypertension':'Paternal','family_Diabetes':'None','family_Asthma':'None','family_Cancer':'None','family_Coronary artery disease':'None','family_Thyroid disease':'None','family_Congenital anomalies':'None','family_Twinning':'None',vsBp:'140/100',vsHr:'82',vsRr:'20',vsTemp:'36.3',vsHt:'147',vsPpw:'49',vsWt:'60.8',abdomenAppearance:'Globular',fundalHeight:'33',fht:'120',efw:'3100',leopoldL1:'Breech',leopoldL2:'Fetal back right, small parts left',leopoldL2MR:'FB',leopoldL2ML:'FSP',leopoldL3:'Cephalic (floating)',leopoldL4:'Not engaged',ieSummary:'Closed cervix',bishopDilation:'Closed',admittingDiagnosis:'1. Gravida 1 Para 0, pregnancy uterine, 39 weeks AOG, cephalic, not in labor\n2. Gestational hypertension vs preeclampsia without severe features'});
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

  const sampleLabel=tab==='ob'?(ob.obFormat==='newMom'?'New Mom':ob.obFormat==='gynecology'?'GYNE':'OB'):tab==='pedia'?'Pedia':ent.entFormat==='trauma'?'Trauma':'ENT';
  return <div className="app">
    <header className="topbar"><div className="topbar-left"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true"/><span>med tools</span></a><nav className="project-links" aria-label="Other projects"><a href="https://micahnut.github.io/friedmans-curve/" target="_blank" rel="noreferrer">Friedman Curve</a></nav></div></header>
    <main className="page">
      <nav className="tabs" aria-label="Form type"><button className={tab==='ob'?'active':''} onClick={()=>{setTab('ob');setCopied(false)}}>OB-GYN <span>01</span></button><button className={tab==='pedia'?'active':''} onClick={()=>{setTab('pedia');setCopied(false)}}>PEDIA <span>02</span></button><button className={tab==='ent'?'active':''} onClick={()=>{setTab('ent');setCopied(false)}}>ENT <span>03</span></button>{SHOW_PRESCRIPTION_TAB&&<button className={tab==='rx'?'active':''} onClick={()=>{setTab('rx');setCopied(false)}}>PRESCRIPTION <span>04</span></button>}</nav>
      <div className={`workspace ${tab==='rx'?'workspace-rx':''} ${tab==='ob'?'workspace-ob':''} ${tab==='ob'&&ob.obFormat==='gynecology'?'workspace-ob-gynecology':''}`}>
        <div className="form-column">
          <div className="form-top"><div><span className="form-index">{tab==='ob'?'01':tab==='pedia'?'02':tab==='ent'?'03':'04'} / {tab==='rx'?'PRESCRIBE':'COMPOSE'}</span><h2>{tab==='ob'?'Obstetric update':tab==='pedia'?'Pediatric update':tab==='ent'?'ENT update':'Prescription pad'}</h2></div><div className="form-actions">{tab!=='rx'&&<><button type="button" className="add-row" onClick={()=>{setCaseImportError('');const snapshot=captureCurrentCase();setSaveCaseName(snapshot.patientName);setSaveCaseOpen(true);}}>Save case</button><button type="button" className="add-row" onClick={()=>{setCaseImportError('');setSavedCasesOpen(true);}}>Saved cases ({savedCases.length})</button><button type="button" className="add-row" onClick={()=>{const snapshot=captureCurrentCase();void exportCase({...snapshot,id:makeSavedCaseId(),name:snapshot.patientName||'Current case',updatedAt:new Date().toISOString()});}}>Export data</button><button type="button" className="add-row" onClick={()=>importFileRef.current?.click()}>Upload data</button><input ref={importFileRef} className="case-file-input" type="file" accept=".json,application/json" onChange={importCaseFile}/><button type="button" className="add-row" onClick={()=>setConfirmation({title:`Load ${sampleLabel} sample?`,message:`This will replace the current form entries with the ${sampleLabel} sample data.`,confirmLabel:`Load ${sampleLabel}`,action:loadSample})}>Load {sampleLabel} sample</button></>}<button className="clear-button" onClick={()=>setConfirmation({title:'Clear this form?',message:'This will remove all entries from the current form. This cannot be undone.',confirmLabel:'Clear form',action:clearForm})}>Clear form</button></div></div>
          {caseFeedback&&<p className="case-feedback" role="status">{caseFeedback}</p>}
          {tab==='ob'&&<div className="ob-interview-toolbar"><div className="ob-view-switch" role="group" aria-label="OB form view"><button type="button" className={!obInterview&&!obPrenatalTab?'active':''} aria-pressed={!obInterview&&!obPrenatalTab} onClick={()=>{setObInterview(false);setObPrenatalTab(false);}}>Compose</button>{SHOW_OB_INTERVIEW&&<button type="button" className={obInterview?'active':''} aria-pressed={obInterview} onClick={()=>{setObInterview(true);setObPrenatalTab(false);setObInterviewStep(0);}}>Interview</button>}{ob.obFormat!=='newMom'&&ob.obFormat!=='gynecology'&&<button type="button" className={obPrenatalTab?'active':''} aria-pressed={obPrenatalTab} onClick={()=>{setObInterview(false);setObPrenatalTab(true);}}>Prenatal logs</button>}</div>{SHOW_OB_INTERVIEW&&obInterview&&<div className="ob-interview-progress"><div><strong>Step {obInterviewStep+1} of {interviewSteps.length}</strong><span>{interviewSteps[obInterviewStep]}</span></div><progress value={obInterviewStep+1} max={interviewSteps.length}/></div>}</div>}
          {tab==='ob' ? <InterviewContext.Provider value={{enabled:obInterview||obPrenatalTab,step:obInterviewStep,view:obPrenatalTab?'prenatal':obInterview?'interview':'compose'}}><>
            {!obInterview&&!obPrenatalTab&&<Section title="Update format"><Field label="Message type" value={ob.obFormat||'obstetrics'} onChange={switchObFormat} options={[["newMom","New Mom"],["obstetrics","Obstetrics"],["gynecology","Gynecology"]]}/></Section>}
            {ob.obFormat==='newMom'?<>
              <Section title="New mom details"><div className="grid two"><Field label="Name" value={ob.newMomName} onChange={v=>update('newMomName',v)}/><Field label="AOG by UTZ" value={ob.newMomAog} onChange={v=>update('newMomAog',v)} placeholder="e.g. 37 6/7 weeks AOG by UTZ"/><Field label="OB score" value={ob.newMomObScore} onChange={v=>update('newMomObScore',v)} placeholder="e.g. G1P0"/><Field label="30/PD" value={ob.newMomMpd} onChange={v=>update('newMomMpd',v)}/><Field label="OB" value={ob.newMomOb} onChange={v=>update('newMomOb',v)} placeholder="e.g. Dr. Taguba"/><Field label="Pedia" value={ob.newMomPedia} onChange={v=>update('newMomPedia',v)} placeholder="e.g. House"/></div></Section>
              <Section title="IE & SE"><div className="grid two"><Field label="IE time" type="time" value={ob.newMomIeTime} onChange={v=>update('newMomIeTime',v)}/><Field label="Dilation" value={ob.newMomDilation} onChange={v=>update('newMomDilation',v)} placeholder="e.g. 4cm"/><Field label="Effacement" value={ob.newMomEffacement} onChange={v=>update('newMomEffacement',v)} placeholder="e.g. 60%"/><Field label="Rupture / fluid / date and time" value={ob.newMomRupture} onChange={v=>update('newMomRupture',v)} placeholder="e.g. Ruptured, clear (07/19/26 7:10am)"/><Field label="Position" value={ob.newMomPosition} onChange={v=>update('newMomPosition',v)} placeholder="e.g. Mid"/><Field label="Consistency" value={ob.newMomConsistency} onChange={v=>update('newMomConsistency',v)} placeholder="e.g. Med"/><Field label="Station" value={ob.newMomStation} onChange={v=>update('newMomStation',v)} placeholder="e.g. -3"/><Field label="SE findings" value={ob.newMomSe} onChange={v=>update('newMomSe',v)} placeholder="e.g. +pooling, clear"/></div></Section>
              <Section title="Fetal assessment & plan"><div className="grid two"><Field label="FH" value={ob.newMomFundalHeight} onChange={v=>update('newMomFundalHeight',v)} placeholder="e.g. 33cm"/><Field label="EFW" value={ob.newMomEfw} onChange={v=>update('newMomEfw',v)} placeholder="e.g. 3,100g"/><Field label="FHT" value={ob.newMomFht} onChange={v=>update('newMomFht',v)} placeholder="e.g. 140s"/><Field label="Plan" value={ob.newMomPlan} onChange={v=>update('newMomPlan',v)} placeholder="e.g. TF"/></div></Section>
            </>:<>
            <Section title="Patient information"><div className="grid two">{[['name','NAME'],['age','AGE'],['mrn','MRN'],['obScore','OB SCORE'],['religion','RELIGION'],['status','STATUS'],['address','ADDRESS'],['occupation','OCCUPATION']].map(([key,label])=><Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)} options={key==='status'?[['','Select'],['Single','Single'],['Married','Married'],['Cohabiting','Cohabiting'],['Separated','Separated'],['Widowed','Widowed'],['Other','Other']]:null}/>)}</div></Section>
            <Section title="Chief complaint & present illness"><div className="grid two"><Field label="CC" value={ob.cc} onChange={v=>update('cc',v)} placeholder="e.g. Watery vaginal discharge"/><Field label="CC date & time" type="datetime-local" value={ob.ccDateTime} disabled={ob.ccDateTimeOmit==='yes'} onChange={v=>update('ccDateTime',v)}/></div><Toggle label="Leave CC date & time blank" checked={ob.ccDateTimeOmit==='yes'} onChange={checked=>{update('ccDateTimeOmit',checked?'yes':'');if(checked)update('ccDateTime','');}}/><Field label="HPI" multiline value={ob.hpi} onChange={v=>update('hpi',v)} placeholder="Describe onset, duration, associated symptoms, pertinent negatives, and reason for consult."/></Section>
            <Section title="Menstrual history" description="MIDAS: menarche, cycle regularity, duration, amount / flow, and symptoms."><div className="grid two"><Field label="M · menarche age" type="number" value={ob.menstrualM} onChange={v=>update('menstrualM',v)}/><Field label="I · cycle regularity" value={ob.menstrualI} onChange={v=>update('menstrualI',v)} options={ [['','Select'],['Regular','Regular'],['Irregular','Irregular']] }/><Field label="D · duration (days)" type="text" inputMode="text" placeholder="e.g. 5–7" value={ob.menstrualD} onChange={v=>update('menstrualD',v)}/><label className="field menstrual-amount-field"><span>A · pads per day</span><input type="text" inputMode="text" placeholder="e.g. 5–7" value={ob.menstrualAmount} onChange={e=>update('menstrualAmount',e.target.value)} aria-label="A · pads per day"/><small>Flow</small><select value={{Light:'Lightly soaked',Moderate:'Moderately soaked','Moderate, regular pad':'Moderately soaked',Heavy:'Fully soaked'}[ob.menstrualSoak]||ob.menstrualSoak} onChange={e=>update('menstrualSoak',e.target.value)} aria-label="A · flow"><option value="">Select flow</option><option value="Lightly soaked">Lightly soaked</option><option value="Moderately soaked">Moderately soaked</option><option value="Fully soaked">Fully soaked</option></select></label></div><div className="menstrual-symptom-row"><Field label="S · symptoms" value={ob.menstrualAssociated} onChange={v=>update('menstrualAssociated',v)} placeholder="Dysmenorrhea or other symptoms"/><Toggle label="Dysmenorrhea" checked={ob.mDysmenorrhea==='yes'} onChange={checked=>{update('mDysmenorrhea',checked);update('menstrualAssociated',checked?'Dysmenorrhea':'None');}}/></div></Section>
            <Section title="Sexual history" description="C = coitarche, P = partners / Pap smear, S = STI history."><div className="grid two"><Field label="C · age at coitarche" type="number" value={ob.sexualC1} onChange={v=>update('sexualC1',v)}/><Field label="P · number of partners" type="number" value={ob.sexualPartnersQty} onChange={v=>update('sexualPartnersQty',v)}/><Field label="Partner gender" value={ob.sexualPartnersGender} onChange={v=>update('sexualPartnersGender',v)} options={ [['','Select'],['Male','Male'],['Female','Female'],['Both','Both'],['Other','Other']] }/><Field label="C · contraception" value={ob.sexualC2} onChange={v=>update('sexualC2',v)} options={ [['','Select'],['None','None'],['Condom','Condom'],['OCP','OCP'],['IUD','IUD'],['Injectable','Injectable'],['Implant','Implant'],['Other','Other']] }/>{ob.sexualC2==='Other'&&<Field label="Other contraception" value={ob.sexualContraceptiveOther} onChange={v=>update('sexualContraceptiveOther',v)}/>}<Field label="Pap smear result" value={ob.sexualPapFinding} onChange={v=>{update('sexualPapFinding',v);if(v==='Not done')update('sexualP2','');}} options={ [['','Select'],['Not done','Not done'],['Normal','Normal'],['Abnormal','Abnormal'],['Pending','Pending']] }/><Field label="P · Pap smear date" type="date" value={ob.sexualP2} disabled={ob.sexualPapFinding==='Not done'} onChange={v=>update('sexualP2',v)}/><Field label="S · STI history" value={ob.sexualS} onChange={v=>update('sexualS',v)} options={ [['','Select'],['None','None'],['History','History'],['Unsure','Unsure']] }/>{ob.sexualS==='History'&&<Field label="STI details" value={ob.sexualStiDetails} onChange={v=>update('sexualStiDetails',v)}/>}</div></Section>
            <Section title="Obstetric history"><div className="grid two">{[['gravidaCount','Gravida'],['parityCount','Parity'],['termCount','Term'],['pretermCount','Preterm'],['abortionCount','Abortion'],['liveBirthCount','Live birth']].map(([key,label])=><Field key={key} label={label} type="number" value={ob[key]} onChange={v=>update(key,v)}/>)}</div><div className="grid two"><Field label="LMP" type="date" value={ob.lmp} onChange={v=>update('lmp',v)}/><Field label="PMP" type="date" value={ob.pmp} onChange={v=>update('pmp',v)}/><div className="field"><span>EDD</span><div className="edd-display">{calculateEdd(ob.lmp)||'Enter LMP to calculate'}</div></div>{ob.obFormat==='gynecology'&&<div className="ob-score-calculator"><span>LIVE OB SCORE</span><strong>{calculateObScore(ob)||clean(ob.obScore)||'Enter Gravida and Parity'}</strong></div>}</div></Section>
            <EditableLogTable title="Obstetric history logs" description="Add one row per pregnancy; the message numbers entries G1, G2, and so on. Choose Current pregnancy to disable the other fields; Year and Outcome stay editable." rows={obstetricHistory} setRows={setObstetricHistory} createRow={makePregnancy} columns={pregnancyLogColumns} rowLabel="G" addLabel="Add pregnancy" kind="pregnancies"/>{ob.obFormat==='obstetrics'&&<Section title="Prenatal visit history" description="Add one entry for each visit or milestone, in chronological order."><div className="repeat-heading spaced"><span>Dating baseline</span><small>LMP-based AOG is calculated separately from the LMP entered in Obstetric history. Enter the AOG stated on the first UTZ; both calculations appear for each visit.</small></div><div className="grid first-utz-grid"><Field label="First UTZ date" type="date" value={ob.firstUtzDate} onChange={v=>update('firstUtzDate',v)}/><Field label="First UTZ AOG · weeks" type="number" value={ob.firstUtzAogWeeks} onChange={v=>update('firstUtzAogWeeks',v)}/><Field label="First UTZ AOG · days" type="number" value={ob.firstUtzAogDays} onChange={v=>update('firstUtzAogDays',v)}/></div><Toggle label="Use first UTZ AOG for dating (otherwise use LMP)" checked={ob.useUtzDating==='yes'} onChange={v=>update('useUtzDating',v)}/><EditableLogTable title="Prenatal history log" description="Enter a visit date for calculated AOG, or choose Manual to type the AOG yourself." rows={prenatalVisits} setRows={setPrenatalVisits} createRow={makePrenatalVisit} columns={[{key:'date',label:'Visit date (optional)',type:'date'},{key:'aog',label:'AOG (calculated or manual)',render:(row,index,changeCell)=>{const manual=row.aogMode==='manual'||(!row.date&&row.aogMode!=='calculated');return <div className="prenatal-aog-entry"><div className="prenatal-aog-mode" role="group" aria-label={`Visit ${index+1} AOG mode`}><button type="button" className={!manual?'active':''} disabled={!row.date} onClick={()=>changeCell('aogMode','calculated')}>Calculated</button><button type="button" className={manual?'active':''} onClick={()=>changeCell('aogMode','manual')}>Manual</button></div>{manual?<input type="text" aria-label={`Visit ${index+1} manual gestational age`} placeholder="e.g. 20 weeks AOG" value={row.timing||''} onChange={event=>changeCell('timing',event.target.value)}/>:<div className="prenatal-aog"><div><span>LMP:</span> {calculateLmpAog(ob.lmp,row.date)||'—'}</div><div><span>UTZ:</span> {calculateUtzAog(row.date,ob.firstUtzDate,ob.firstUtzAogWeeks,ob.firstUtzAogDays)||'—'}</div></div>}</div>}},{key:'details',label:'Pertinent findings / labs / medications prescribed',multiline:true,placeholder:'Visit findings, labs, medications, and plan'}]} rowLabel="Visit" addLabel="Add prenatal visit" kind="prenatal"/></Section>}
            <Section title="Past medical history"><small>Choose None alone, or select all applicable history.</small><CheckGroup options={pmhOptions} selected={ob.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={obProcedureSelections} onChange={setObProcedureSelections}/>{obProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={procedureEvents} setRows={setProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Current medications"><Field label="Current Medications" multiline value={ob.medications} onChange={v=>update('medications',v)}/></Section><Section title="Personal & social history"><div className="repeat-heading"><span>Allergies</span><small>Choose one status; add details if present.</small></div><CheckGroup options={['No known allergies','Known allergy']} selected={ob.allergyFlags} onChange={v=>update('allergyFlags',v)} exclusive={['No known allergies','Known allergy']}/>{Array.isArray(ob.allergyFlags)&&ob.allergyFlags.includes('Known allergy')&&<Field label="Food and drug allergy details" value={ob.allergies} onChange={v=>update('allergies',v)} placeholder="List the allergy and reaction if known."/>}<div className="grid two"><Field label="Smoker" value={ob.smoking} onChange={v=>update('smoking',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/><Field label="Alcoholic beverage drinker" value={ob.alcohol} onChange={v=>update('alcohol',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/>{ob.alcohol==='Yes'&&<Field label="Alcohol details" value={ob.alcoholDetails} onChange={v=>update('alcoholDetails',v)} placeholder="e.g. Occasional; last intake January 2025"/>}<Field label="Illicit drug use" value={ob.illicitDrugUse} onChange={v=>update('illicitDrugUse',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/></div></Section>
            <Section title="Immunizations"><CheckGroup options={['COVID','Influenza','Pneumococcal','Tetanus / TT','Tdap','Booster']} selected={ob.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/><div className="grid two">{[['vaccineCovid','COVID details'],['vaccineFlu','Influenza details'],['vaccinePneumococcal','Pneumococcal details'],['vaccineTt','Tetanus / TT details'],['vaccineTdap','Tdap details'],['vaccineBooster','Booster details']].map(([key,label])=>Array.isArray(ob.immunizationSelections)&&ob.immunizationSelections.includes(label.replace(' details',''))?<Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)}/>:null)}</div></Section>
            <Section title="Family history"><Toggle label="No known family history" checked={ob.familyHistoryNone==='yes'} onChange={value=>{update('familyHistoryNone',value);familyLabels.forEach(label=>update(`family_${label}`,value?'None':''));}}/>{ob.familyHistoryNone!=='yes'&&<div className="family-checkbox-grid">{familyLabels.map(label=><FamilyRow key={label} label={label} value={ob[`family_${label}`]||''} onChange={value=>update(`family_${label}`,value)}/>)}</div>}{['Maternal','Paternal','Both'].includes(ob.family_Cancer)&&<Field label="Cancer type" value={ob.family_CancerDetail} onChange={v=>update('family_CancerDetail',v)} placeholder="e.g. Lung cancer"/>}</Section>
            <Section title="Vital signs"><div className="grid two">{[['vsBp','BP'],['vsHr','HR'],['vsRr','RR'],['vsTemp','TEMP'],['vsPpw','PPW'],['vsWt','WT'],['vsHt','HT']].map(([key,label])=><Field key={key} label={label} value={ob[key]} onChange={v=>update(key,v)}/>)}</div></Section>
            <Section title="Physical examination" description="Select the documented findings. Selecting Essentially normal clears abnormal findings in that system."><div className="exam-grid">{examGroups.map(([title,options])=>{const keys={'HEENT':'examHEENT','Chest / lungs':'examChest','Cardiovascular':'examCV','Abdomen':'examAbdomen','GU / IE':'examGU','Skin / extremities':'examSkin'};return <div className="exam-card" key={title}><h3>{title}</h3><CheckGroup options={options} selected={ob[keys[title]]} onChange={v=>update(keys[title],v)} exclusive={['Essentially normal']}/></div>;})}</div>{ob.obFormat==='gynecology'?<Field label="Abdominal exam findings" multiline value={ob.gyneAbdominalExam||''} onChange={v=>update('gyneAbdominalExam',v)} placeholder="+9cm vertical scar on hypogastric area, flabby, soft, tympanitic, tenderness on hypogastric, LLQ and RLQ, +Rovsing, +rebound, +psoas sign, +obturator sign"/>:<><div className="repeat-heading spaced"><span>Abdominal / obstetric exam details</span><small>Enter only values documented for this encounter.</small></div><div className="grid two"><Field label="Abdominal appearance" value={ob.abdomenAppearance} onChange={v=>update('abdomenAppearance',v)} placeholder="e.g. Globular"/><Field label="Fundal height (cm)" type="number" value={ob.fundalHeight} onChange={v=>update('fundalHeight',v)}/><Field label="Fetal heart tone" value={ob.fht} onChange={v=>update('fht',v)}/><Field label="Estimated fetal weight (g)" type="number" value={ob.efw} onChange={v=>update('efw',v)}/></div><div className="repeat-heading spaced"><span>Cervical assessment · Bishop score</span><small>Select findings documented on examination.</small></div><div className="grid two"><Field label="Dilation" value={ob.bishopDilation} onChange={v=>update('bishopDilation',v)} options={bishopOptions.dilation}/><Field label="Effacement" value={ob.bishopEffacement==='SE / 0-30%'?'0-30%':ob.bishopEffacement} onChange={v=>update('bishopEffacement',v)} options={bishopOptions.effacement}/><Field label="Station" value={ob.bishopStation==='-3 / Floating'?'-3':ob.bishopStation} onChange={v=>update('bishopStation',v)} options={bishopOptions.station}/><Field label="Consistency" value={ob.bishopConsistency} onChange={v=>update('bishopConsistency',v)} options={bishopOptions.consistency}/><Field label="Position" value={ob.bishopPosition} onChange={v=>update('bishopPosition',v)} options={bishopOptions.position}/></div><small className="score-summary">{calculateBishopScore(ob)===null?'Bishop score appears when all five findings are selected.':`Calculated Bishop score: ${calculateBishopScore(ob)}/13`}</small></>}{ob.obFormat==='gynecology'?<><div className="repeat-heading spaced"><span>Gynecologic examination · ICUAD</span><small>Enter the documented findings for each part.</small></div><div className="grid two"><Field label="I · Introitus" value={ob.peIntroitus||''} onChange={v=>update('peIntroitus',v)} hint="Example: Parous, no lesions"/><Field label="C · Cervix" value={ob.peCervix||''} onChange={v=>update('peCervix',v)} hint="Example: + CMT, 1×1 cm, posterior, smooth"/><Field label="U · Uterus" value={ob.peUterus||''} onChange={v=>update('peUterus',v)} hint="Example: Nonpalpable due to body habitus; + hypogastric tenderness"/><Field label="A · Adnexa" value={ob.peAdnexa||''} onChange={v=>update('peAdnexa',v)} hint="Example: LLQ and RLQ tenderness"/><Field label="D · Discharge / membranes" value={ob.peDischarge||''} onChange={v=>update('peDischarge',v)} hint="Example: Non-bloody on finger"/></div></>:<><div className="repeat-heading spaced"><span>Leopold maneuvers</span><small>Select the finding for each step.</small></div><div className="grid two"><Field label="L1 · fundus presentation" value={ob.leopoldL1} onChange={v=>update('leopoldL1',v)} options={[["","Select"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L2 · maternal right" value={ob.leopoldL2MR} onChange={v=>update('leopoldL2MR',v)} options={[["","Select"],["FB","FB"],["FSP","FSP"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L2 · maternal left" value={ob.leopoldL2ML} onChange={v=>update('leopoldL2ML',v)} options={[["","Select"],["FB","FB"],["FSP","FSP"],["Cephalic","Cephalic"],["Breech","Breech"]]}/><Field label="L3 · Pawlik's grip" value={ob.leopoldL3} onChange={v=>update('leopoldL3',v)} options={[["","Select"],["Cephalic (floating)","Cephalic (floating)"],["Cephalic (engaged)","Cephalic (engaged)"],["Breech","Breech"],["Empty","Empty"]]}/><Field label="L4 · engagement" value={ob.leopoldL4} onChange={v=>update('leopoldL4',v)} options={[["","Select"],["Engaged","Engaged"],["Not engaged","Not engaged"]]}/></div></>}<Field label="Admitting diagnosis" multiline value={ob.admittingDiagnosis} onChange={v=>update('admittingDiagnosis',v)} placeholder="Enter each diagnosis on a new line."/></Section>
            </>}
            {obInterview&&obInterviewStep===interviewReviewStep&&<section className="interview-review"><span className="form-index">REVIEW</span><h3>Ready to send</h3><p>Your answers are already assembled in the live preview. Check the note, then copy it when you are ready.</p><button type="button" className="copy-button" onClick={copyOutput}><span>{copied?'✓':'▣'}</span>{copied?'Copied':'Copy message'}<kbd>{copied?'READY':'⌘ C'}</kbd></button></section>}
            {obInterview&&<div className="interview-nav"><button type="button" className="add-row" disabled={obInterviewStep===0} onClick={()=>setObInterviewStep(step=>Math.max(0,step-1))}>Back</button><span>{obInterviewStep+1} / {interviewSteps.length}</span>{obInterviewStep<interviewReviewStep?<button type="button" className="add-row interview-next" onClick={()=>setObInterviewStep(step=>Math.min(interviewReviewStep,step+1))}>Continue</button>:<button type="button" className="add-row interview-next" onClick={()=>setObInterview(false)}>Return to compose</button>}</div>}
          </></InterviewContext.Provider> : tab==='pedia' ? <>
            <Section title="Date & location"><div className="grid two"><Field label="Update date" type="date" value={pedia.dateLine} onChange={v=>update('dateLine',v)}/><Field label="LRDR Bed #" value={pedia.bed} onChange={v=>update('bed',v)}/></div></Section>
            <Section title="Mother & care team"><div className="grid two">{[['motherName',"Mother's name"],['address','Address'],['civilStatus','Civil Status'],['age','Age'],['ob','OB'],['pedia','Pedia'],['gender',"Baby's Gender"]].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)} options={key==='civilStatus'?[['','Select'],['Single','Single'],['Married','Married'],['Cohabiting','Cohabiting'],['Separated','Separated'],['Widowed','Widowed'],['Other','Other']]:key==='gender'?[['','Select'],['Girl','Girl'],['Boy','Boy'],['Unknown','Unknown'],['Other','Other']]:null}/>)}</div></Section>
            <Section title="Pregnancy details"><div className="grid two">{[['obScore','OB score'],['lmp','LMP'],['aogLmp','AOG by LMP'],['aogUtz','AOG by UTZ'],['fh','FH'],['efw','EFW'],['firstPnc','First PNC']].map(([key,label])=><Field key={key} label={label} type={key==='lmp'?'date':'text'} value={pedia[key]} onChange={v=>update(key,v)}/ >)}<div className="field"><span>EDD</span><div className="edd-display">{calculateEdd(pedia.lmp)||'Enter LMP to calculate'}</div></div></div></Section>
            <Section title="Maternal labs & screening"><div className="grid two">{[['maternalBt','Mat BT'],['paternalBt','Pat BT'],['hbsag','HbsAg'],['hiv','HIV'],['syphilis','Syphilis'],['papsmear','Papsmear'],['cas','CAS'],['gbs','GBS'],['ogtt','OGTT']].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)}/>)}</div></Section>
            
            <Section title="Prenatal care & complications"><Field label="Prenatal vitamins / meds" multiline value={pedia.prenatalMeds} onChange={v=>update('prenatalMeds',v)}/><div className="grid two">{[['maternalHtn','Hypertension'],['maternalDiabetes','Diabetes'],['maternalAsthma','Asthma']].map(([key,label])=><Field key={key} label={label} value={pedia[key]} onChange={v=>update(key,v)} options={ [['','Not specified'],['No','No'],['Yes','Yes']] }/>)}</div><Field label="Other maternal complications" value={pedia.complicationsOther} onChange={v=>update('complicationsOther',v)}/><EditableLogTable title="Pertinent prenatal history log" description="Record AOG or visit timing and the corresponding details." rows={pediaPrenatalVisits} setRows={setPediaPrenatalVisits} createRow={makePrenatalVisit} columns={prenatalLogColumns} rowLabel="Visit" addLabel="Add prenatal visit" kind="pedia-prenatal"/></Section>
            <Section title="Latest ultrasound"><div className="grid two"><Field label="Date" type="date" value={pedia.usDate} onChange={v=>update('usDate',v)}/></div><Field label="Details" multiline value={pedia.latestUs} onChange={v=>update('latestUs',v)}/></Section>
            <EditableLogTable title="Obstetric history logs" description="Add one row per pregnancy; the message numbers entries G1, G2, and so on." rows={pediaObstetricHistory} setRows={setPediaObstetricHistory} createRow={makePregnancy} columns={pregnancyLogColumns} rowLabel="G" addLabel="Add pregnancy" kind="pregnancies"/><Section title="Past medical history"><small>Choose None alone, or select all applicable medical conditions.</small><CheckGroup options={pediaPmhOptions} selected={pedia.pmh} onChange={v=>update('pmh',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={pediaProcedureSelections} onChange={setPediaProcedureSelections}/>{pediaProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={pediaProcedureEvents} setRows={setPediaProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Vaccines"><CheckGroup options={['COVID','Influenza','Pneumococcal','Tetanus / TT','Tdap','Booster']} selected={pedia.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/><div className="grid two">{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('COVID')&&<><Field label="Covid vaccine" value={pedia.covidBrand} onChange={v=>update('covidBrand',v)} options={ [['','Select'],['Sinovac','Sinovac'],['Pfizer','Pfizer'],['Moderna','Moderna'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/><Field label="Covid doses" type="number" value={pedia.covidDoses} onChange={v=>update('covidDoses',v)}/></>}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Influenza')&&<Field label="Influenza details" value={pedia.vaccineFlu} onChange={v=>update('vaccineFlu',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Pneumococcal')&&<Field label="Pneumococcal details" value={pedia.vaccinePneumococcal} onChange={v=>update('vaccinePneumococcal',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Booster')&&<><Field label="Booster 1" value={pedia.booster1} onChange={v=>update('booster1',v)} options={ [['','None'],['Moderna','Moderna'],['Pfizer','Pfizer'],['Sinovac','Sinovac'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/><Field label="Booster 2" value={pedia.booster2} onChange={v=>update('booster2',v)} options={ [['','None'],['Moderna','Moderna'],['Pfizer','Pfizer'],['Sinovac','Sinovac'],['AstraZeneca','AstraZeneca'],['Other','Other']] }/></>}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Tdap')&&<Field label="Prenat · Tdap doses" type="number" value={pedia.tdapDoses} onChange={v=>update('tdapDoses',v)}/ >}{Array.isArray(pedia.immunizationSelections)&&pedia.immunizationSelections.includes('Tetanus / TT')&&<Field label="Prenat · TT doses" type="number" value={pedia.ttDoses} onChange={v=>update('ttDoses',v)}/>}</div></Section>
            <Section title="Family medical history"><Toggle label="No known family history" checked={pedia.familyHistoryNone==='yes'} onChange={value=>{update('familyHistoryNone',value);pediaFamily.forEach(([key])=>update(key,value?'None':''));}}/>{pedia.familyHistoryNone!=='yes'&&<div className="family-checkbox-grid">{pediaFamily.map(([key,label])=><FamilyRow key={key} label={label} value={pedia[key]||''} onChange={value=>update(key,value)}/>)}</div>}{!pedia.familyHistoryNone&&(['Paternal','Maternal','Both'].includes(pedia.familyCancer))&&<Field label="Cancer type / relative" value={pedia.familyCancerDetail} onChange={v=>update('familyCancerDetail',v)}/>}</Section>
            <Section title="Personal & social history"><div className="grid two"><Field label="Smoking history" value={pedia.pshSmoking} onChange={v=>update('pshSmoking',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/><Field label="Alcohol history" value={pedia.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/>{pedia.pshAlcohol==='Yes'&&<Field label="Alcohol details" value={pedia.pshAlcoholDetails} onChange={v=>update('pshAlcoholDetails',v)} placeholder="e.g. Occasional; last intake December 2025"/>}<Field label="Illicit drug use" value={pedia.pshDrugs} onChange={v=>update('pshDrugs',v)} options={ [['','Select'],['No','No'],['Yes','Yes']] }/></div><Field label="Food or drug allergies" value={pedia.pshAllergies} onChange={v=>update('pshAllergies',v)}/></Section>
            <Section title="Current presentation & plan"><Field label="CC" value={pedia.cc} onChange={v=>update('cc',v)}/><Field label="HPI" multiline value={pedia.hpi} onChange={v=>update('hpi',v)}/><div className="grid two"><Field label="IE" value={pedia.ie} onChange={v=>update('ie',v)}/><Field label="FH · current" value={pedia.lateFh} onChange={v=>update('lateFh',v)}/><Field label="EFW · current" value={pedia.lateEfw} onChange={v=>update('lateEfw',v)}/><Field label="FHT" value={pedia.fht} onChange={v=>update('fht',v)}/></div><Field label="Plan" multiline value={pedia.plan} onChange={v=>update('plan',v)}/></Section>
          </> : tab==='ent' ? <>
            <div className="format-note"><b>ENT message format</b><span>Switch between the short new blotter update and the complete history format.</span></div>
            <Section title="Update format"><Field label="Message type" value={ent.entFormat} onChange={v=>update('entFormat',v)} options={[['blotter','New blotter update'],['complete','Complete history'],['trauma','Trauma']]}/></Section>
            {ent.entFormat==='trauma'?<Section title="General data"><div className="grid two"><Field label="Date in trauma heading" type="date" value={ent.date} onChange={v=>update('date',v)}/><Field label="Time received" type="time" value={ent.traumaTimeReceived} onChange={v=>update('traumaTimeReceived',v)}/><Field label="Name" value={ent.name} onChange={v=>update('name',v)}/><Field label="Age" type="number" value={ent.age} onChange={v=>update('age',v)}/><Field label="Gender" value={ent.sex} onChange={v=>update('sex',v)} options={[["","Select"],["M","Male"],["F","Female"]]}/><Field label="Hospital #" value={ent.hospitalNumber} onChange={v=>update('hospitalNumber',v)}/><Field label="Reason for referral" value={ent.reasonReferral} onChange={v=>update('reasonReferral',v)}/></div></Section>:<Section title="General data"><div className="grid two"><Field label="Date" type="date" value={ent.date} onChange={v=>update('date',v)}/><Field label="Name" value={ent.name} onChange={v=>update('name',v)}/><Field label="Age" value={ent.age} onChange={v=>update('age',v)}/><Field label="Sex" value={ent.sex} onChange={v=>update('sex',v)} options={[["","Select"],["M","Male"],["F","Female"]]}/><Field label="Address" value={ent.address} onChange={v=>update('address',v)}/>{ent.entFormat==='blotter'&&<Field label="Nationality" value={ent.nationality} onChange={v=>update('nationality',v)}/>}<Field label="Religion" value={ent.religion} onChange={v=>update('religion',v)}/><Field label="Cellphone number" value={ent.contact} onChange={v=>update('contact',v)}/>{ent.entFormat==='blotter'&&<Field label="Chief complaint" value={ent.cc} onChange={v=>update('cc',v)}/>}</div></Section>}
            {ent.entFormat==='trauma'&&<><Section title="Working impression & injury details"><Field label="Working impression" multiline value={ent.workingImpression} onChange={v=>update('workingImpression',v)} placeholder="Enter each impression on a new line."/><div className="grid two"><Field label="NOI · Nature of injury" value={ent.noi} onChange={v=>update('noi',v)}/><Field label="TOI · Time of injury" type="time" value={ent.toi} onChange={v=>update('toi',v)}/><Field label="DOI · Date of injury" type="date" value={ent.doi} onChange={v=>update('doi',v)}/><Field label="POI · Place of injury" value={ent.poi} onChange={v=>update('poi',v)}/></div><Field label="Injury narrative" multiline value={ent.injuryNarrative} onChange={v=>update('injuryNarrative',v)}/></Section><Section title="Past medical history" description="Choose None alone, or select all applicable history."><CheckGroup options={entPmhOptions} selected={ent.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/><Toggle label="No maintenance medication" checked={ent.medicationsNone==='yes'} onChange={v=>update('medicationsNone',v)}/>{ent.medicationsNone!=='yes'&&<Field label="Maintenance medications" value={ent.maintenanceMeds} onChange={v=>update('maintenanceMeds',v)}/>}</Section><Section title="Previous admissions or surgeries" description="Select each applicable history, then add one row per event."><CheckGroup options={procedureHistoryOptions} selected={entProcedureSelections} onChange={setEntProcedureSelections}/>{entProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={entProcedureEvents} setRows={setEntProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Immunizations"><CheckGroup options={["Childhood Immunizations","COVID-19 vaccine"]} selected={ent.immunizationSelections} onChange={v=>update('immunizationSelections',v)}/></Section><Section title="Personal & social history"><div className="grid two"><Field label="Smoking history" value={ent.pshSmoking} onChange={v=>update('pshSmoking',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Alcohol history" value={ent.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Illicit drug use" value={ent.pshDrugs} onChange={v=>update('pshDrugs',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Food or drug allergies" value={ent.allergies} onChange={v=>update('allergies',v)}/></div></Section><Section title="Family history"><Toggle label="No known family history" checked={ent.familyDiseasesNone==='yes'} onChange={v=>{update('familyDiseasesNone',v);entFamilyFields.forEach(([key])=>update(key,''));}}/>{ent.familyDiseasesNone!=='yes'&&<div className="family-checkbox-grid">{entFamilyFields.map(([key,label])=><FamilyRow key={key} label={label} value={ent[key]||''} onChange={v=>update(key,v)}/>)}</div>}</Section><Section title="Physical examination"><Field label="General survey" multiline value={ent.traumaSurvey} onChange={v=>update('traumaSurvey',v)}/><StatusChecklist items={traumaFindings} selected={ent.traumaFindings} onChange={v=>update('traumaFindings',v)}/></Section></>}{ent.entFormat==='complete'&&<><Section title="History & assessment"><Field label="History of present illness" multiline value={ent.hpi} onChange={v=>update('hpi',v)}/><Field label="Assessment" multiline value={ent.assessment} onChange={v=>update('assessment',v)}/></Section><Section title="Past medical history"><small>Choose None alone, or select all applicable history.</small><CheckGroup options={entPmhOptions} selected={ent.pmhSelections} onChange={v=>update('pmhSelections',v)} exclusive={['None']}/></Section><Section title="Previous admissions or surgeries"><small>Select each applicable history, then add one row per event.</small><CheckGroup options={procedureHistoryOptions} selected={entProcedureSelections} onChange={setEntProcedureSelections}/>{entProcedureSelections.length>0&&<EditableLogTable title="Previous hospitalizations or surgeries" description="Add one row per admission or procedure." rows={entProcedureEvents} setRows={setEntProcedureEvents} createRow={makeProcedureEvent} columns={procedureLogColumns} rowLabel="Event" addLabel="Add hospitalization / surgery" kind="events"/>}</Section><Section title="Immunizations"><CheckGroup options={["Childhood Immunizations","COVID-19 vaccine"]} selected={ent.immunizationSelections} onChange={v=>update("immunizationSelections",v)}/></Section><Section title="Personal & social history"><Field label="Smoking history" value={ent.pshSmoking} onChange={v=>update('pshSmoking',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Alcohol history" value={ent.pshAlcohol} onChange={v=>update('pshAlcohol',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Illicit drug use" value={ent.pshDrugs} onChange={v=>update('pshDrugs',v)} options={[["","Select"],["No","No"],["Yes","Yes"]]}/><Field label="Food or drug allergies" value={ent.allergies} onChange={v=>update('allergies',v)}/></Section><Section title="Family history"><div className="family-checkbox-grid">{entFamilyFields.map(([key,label])=><FamilyRow key={key} label={label} value={ent[key]||''} onChange={v=>update(key,v)}/>)}</div></Section><Section title="Physical examination"><Field label="General survey" multiline value={ent.generalSurvey} onChange={v=>update('generalSurvey',v)}/>{entExamGroups.map(([label,key,items])=><div className="exam-card" key={key}><h3>{label}</h3><StatusChecklist items={items} selected={ent[key]} onChange={v=>update(key,v)}/></div>)}</Section></>}
          </> : null}
          {tab==='rx'&&<>
            {rxPads.map((value,index)=><PrescriptionForm key={index} value={value} index={index} onChange={updateRx}/>) }
          </>}
        </div>
        <aside className="preview-column">{tab==='rx'?<div className="rx-preview-sticky"><div className="preview-heading"><div><span className="form-index">LIVE PREVIEW</span><h2>UCMed prescriptions</h2></div><span className="live-dot">LIVE</span></div><div className="rx-preview-shell"><PrescriptionPadPreview values={rxPads}/></div><button className="copy-button" onClick={()=>window.print()}><span>▣</span>Print / Save as PDF<kbd>PDF</kbd></button><p className="preview-hint">Each input form fills its matching pad in the upper half of a Letter-size sheet.</p></div>:<div className="preview-sticky"><div className="preview-heading"><div><span className="form-index">LIVE PREVIEW</span><h2>Ready to send</h2></div><span className="live-dot">LIVE</span></div><div className="preview-paper"><div className="paper-top"><span>MESSAGE PREVIEW</span><span>PLAIN TEXT</span></div><textarea className="preview-output" readOnly value={output} aria-label="Generated message preview"/></div><button className="copy-button" onClick={copyOutput}><span>{copied?'✓':'▣'}</span>{copied?'Copied':'Copy message'}<kbd>{copied?'READY':'⌘ C'}</kbd></button><p className="preview-hint">Draft saves automatically in this browser on this device. Clear the form to remove its saved draft.</p></div>}</aside>
      </div>
    </main>
    {saveCaseOpen&&<div className="case-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSaveCaseOpen(false);}}><section className="case-modal" role="dialog" aria-modal="true" aria-labelledby="save-case-title"><div className="case-modal-heading"><div><span className="form-index">LOCAL BROWSER STORAGE</span><h2 id="save-case-title">Save patient case</h2></div><button type="button" className="case-close" aria-label="Close" onClick={()=>setSaveCaseOpen(false)}>×</button></div><label className="case-name-field">Case name<input autoFocus value={saveCaseName} onChange={event=>setSaveCaseName(event.target.value)} placeholder="Patient name or case label"/></label><p>This saves the current form and its history logs in this browser on this device.</p><div className="case-modal-actions"><button type="button" className="confirm-cancel" onClick={()=>setSaveCaseOpen(false)}>Cancel</button><button type="button" className="case-primary" onClick={saveCurrentCase}>Save case</button></div></section></div>}
    {savedCasesOpen&&<div className="case-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSavedCasesOpen(false);}}><section className="case-modal saved-cases-modal" role="dialog" aria-modal="true" aria-labelledby="saved-cases-title"><div className="case-modal-heading"><div><span className="form-index">LOCAL BROWSER STORAGE</span><h2 id="saved-cases-title">Saved patient cases</h2></div><button type="button" className="case-close" aria-label="Close" onClick={()=>setSavedCasesOpen(false)}>×</button></div><p className="case-modal-intro">Cases are stored in this browser. Export data to keep a file or move it to another device.</p>{caseImportError&&<p className="case-import-error" role="alert">{caseImportError}</p>}{savedCases.length===0?<div className="case-empty">No saved cases yet. Use Save case to keep the current form here.</div>:<div className="saved-case-list">{savedCases.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(record=><article className="saved-case-card" key={record.id}><div className="saved-case-info"><strong>{record.name||'Untitled case'}</strong><span>{record.tab==='ob'?(record.format==='gynecology'?'Gynecology':record.format==='newMom'?'New Mom':'Obstetrics'):record.tab==='pedia'?'Pediatrics':'ENT'} · {record.updatedAt?new Date(record.updatedAt).toLocaleString():'Saved case'}</span></div><div className="saved-case-actions"><button type="button" className="case-primary" onClick={()=>loadSavedCase(record)}>Load</button><button type="button" className="case-secondary" onClick={()=>void exportCase(record)}>Export data</button><button type="button" className="case-delete" onClick={()=>setConfirmation({title:'Delete saved case?',message:`“${record.name||'Untitled case'}” will be removed from this browser.`,confirmLabel:'Delete case',action:()=>{setSavedCases(current=>current.filter(item=>item.id!==record.id));if(activeSavedCaseId===record.id)setActiveSavedCaseId(null);}})}>Delete</button></div></article>)}</div>}</section></div>}
    {confirmation&&<ConfirmationModal title={confirmation.title} message={confirmation.message} confirmLabel={confirmation.confirmLabel} onCancel={()=>setConfirmation(null)} onConfirm={()=>{const action=confirmation.action;setConfirmation(null);action();}}/>}
  </div>;
}
