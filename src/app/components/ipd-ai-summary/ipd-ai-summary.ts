import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PkAlertService, PkIcon, PkTabsModule, PkToastrService } from 'ngx-pk-ui';
import { AIService } from '../../services/ai.service';

interface AdmissionRecord {
  id: string;
  an: string;
}

@Component({
  selector: 'app-ipd-ai-summary',
  imports: [
    NgOptimizedImage, ReactiveFormsModule, FormsModule,
    PkIcon, PkTabsModule,
    CommonModule
  ],
  templateUrl: './ipd-ai-summary.html',
  styleUrl: './ipd-ai-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpdAiSummary {
  private aiService = inject(AIService);
  private toastr = inject(PkToastrService);
  private alert = inject(PkAlertService);
  private fb = inject(FormBuilder);

  records = signal<AdmissionRecord[]>([]);
  activeId = signal<string | null>(null);
  anInput = signal('');
  activeTab = signal('patient');
  isLoading = signal(false);
  sidebarOpen = signal(false);
  sidebarCollapsed = signal(false);

  aiPrompt: any = signal(null);
  aiResponse: any = signal(null);

  isTopicPhase = computed(() => this.activeId() === null);
  activeAN = computed(() => this.records().find((r) => r.id === this.activeId())?.an ?? null);

  readonly sexOptions = ['ชาย', 'หญิง'];
  readonly dischargeStatusOptions = [
    '',
    'ทุเลา/หายดี',
    'ทุเลา',
    'ไม่สมัครใจอยู่',
    'หนีกลับ',
    'ส่งต่อ',
    'เสียชีวิต < 48 ชม.',
    'เสียชีวิต ≥ 48 ชม.',
  ];

  /* shared Tailwind class strings (reduces template repetition) */
  readonly cls = {
    input:
      'w-full rounded-lg border border-gray-300 dark:border-gray-600 ' +
      'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ' +
      'px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700 ' +
      'focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500',
    textarea:
      'w-full rounded-lg border border-gray-300 dark:border-gray-600 ' +
      'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ' +
      'px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700 ' +
      'focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 resize-y',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
    section:
      'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ' +
      'tracking-wider pb-2 border-b border-gray-200 dark:border-gray-700 mb-4',
  };

  form = this.fb.group({
    // Demographics
    age: [''],
    sex: [''],
    // Vital signs
    weight: [''],
    height: [''],
    sbp: [''],
    dbp: [''],
    rr: [''],
    hr: [''],
    temp: [''],
    coma: [''],
    // Admission / Discharge
    admitDate: [''],
    dischargeDate: [''],
    los: [''],
    dischargeStatus: [''],
    // Clinical
    cc: [''],
    pi: [''],
    pmh: [''],
    progressNotes: [''],
    nurseNotes: [''],
    consultNotes: [''],
    // Results
    labResults: [''],
    imagingReports: [''],
    // Procedures
    operativeNotes: [''],
    procedures: [''],
    // Medications
    inHospitalMeds: [''],
    dischargeMeds: [''],
    pdx: [''],
    sdx: [''],
    procedure: [''],
  });
  requiredFields = ['cc', 'pi', 'pmh', 'progressNotes', 'nurseNotes', 'consultNotes',
    'labResults', 'imagingReports', 'operativeNotes',
    'procedures', 'inHospitalMeds', 'dischargeMeds'];

  onSetAN(): void {
    if (!this.anInput().trim()) return;
    const id = Date.now().toString();
    this.records.update((r) => [...r, { id, an: this.anInput().trim() }]);
    this.activeId.set(id);
    this.anInput.set('');
    this.resetForm();
    this.sidebarOpen.set(false);
  }

  onNewChat(): void {
    this.activeId.set(null);
    this.anInput.set('');
    this.sidebarOpen.set(false);
  }

  selectRecord(id: string): void {
    this.activeId.set(id);
    this.resetForm();
    this.sidebarOpen.set(false);
  }

  resetForm(): void {
    this.form.reset({
      sex: this.sexOptions[0],
      dischargeStatus: this.dischargeStatusOptions[1],
      age: '', sbp: '', dbp: '', rr: '', hr: '', coma: '',
      cc: '',
      // cc: `เหนื่อยมากขึ้น เบื่ออาหาร ปวดเอวมาก มียาแก้ปวดพอทุเลา เดินได้สะดวก`,
      pi: '',
//       pi: `Case CA Rectum
// S/P LAR 28/10/65 @KKH
// Patho : Rectosigmoid colon, resection: 28/10/2565
// - Adenocarcinoma, moderately differentiated, invading through muscular layer into pericolic fat.
// `,
      pmh: '',
      progressNotes: '',
//       progressNotes: `reverse A/G ratio r/o MM
// Diagnosis : CA colon S/P surgery
// Patho : 1. Rectosigmoid colon, resection:
// - Adenocarcinoma, moderately differentiated, invading through muscular layer into pericolic fat.
// - No angiolymphatic invasion.
// - Free proximal, distal and radial resected margins.
// - No metastatic carcinoma in all sixteen pericolic lymph nodes (0/16).
// `,
      nurseNotes: '',
      consultNotes: '',
      labResults: '',
//       labResults: `Lab Cr 1.89
// Uric 11.3
// Alb 3.6 Glob 9.2
// Na 128 K 3.8 Ca 11.3
// Hb 6.7 Hct 20.6 Plt 151000
// Imp: MM with anemia and hypercalcemia AKI
// Mx: Admit for hydration and blood transfusion
// `,
      imagingReports: '',
//       imagingReports: `NOTE: Immunohistochemical studies for CD138, Kappa and Lambda are pending.
// Addendum 1
// - Consistent with marrow involvement by plasma cell neoplasm, supported by immunohistochemistry
// - Immunohistochemical studies show CD138-highlighted plasma cells (90%) with Kappa light chain restriction (Kappa:Lambda ratio more than 20:1).

// SPEP 21/4/69 : Monoclonal gammopathy (TP 13 g/dl, M spike 5.0 g/dl)
// `,
    });
    this.toastr.info('', 'reset form', { position: 'bottom-right', progress: true });
  }

  onAnKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSetAN();
    }
  }

  aiContent = '';
  async onSubmit(): Promise<void> {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    // TODO: call AI summary API
    const row: any = this.form.value;
    let data: any = {};
    let hasEmptyRequired = 0;
    for (let fld in row) {
      if (row[fld]) {
        data[fld] = ['pdx', 'sdx', 'procedure'].includes(fld) ?
          row[fld].replace(/\s/g, '').toUpperCase() :
          row[fld];
        if (this.requiredFields.includes(fld)) {
          hasEmptyRequired++;
        }
      }
    }

    console.log(this.form.value);
    console.log(data);

    if (hasEmptyRequired < 2) {
      this.isLoading.set(false);
      return this.alert.error('ประวัติคลินิก, บันทึกทางการแพทย์, ผลการตรวจ, การผ่าตัด, ยา', 'ต้องมีข้อมูลอย่างน้อย 2 รายการ');
    }

    let systemMessageThai = "คุณคือ AI ผู้เชี่ยวชาญด้านเวชระเบียนและรหัสโรค (Medical Coder) จงวิเคราะห์ข้อมูลผู้ป่วยและสรุปผลเป็นรูปแบบ JSON เท่านั้น โดยบังคับให้มีคีย์ต่อไปนี้: principal_diagnosis (โรคหลัก), icd_10_pdx (รหัสโรคหลัก), secondary_diagnosis (โรคร่วม/แทรกซ้อน ถ้าไม่มีให้ใส่ None), procedure (หัตถการ)";
    let payloadThai = '';
    if (data?.sex) {
      payloadThai += `ผู้ป่วย${data.sex} `;
    }
    if (data?.age) {
      payloadThai += `อายุ ${data.age} ปี `;
    }
    if (data?.weight) {
      payloadThai += `น้ำหนัก ${data.weight} กิโลกรัม `;
    }
    if (data?.height) {
      payloadThai += `ส่วนสูง ${data.height} เซนติเมตร `;
    }
    if (data?.sbp && data?.dbp) {
      payloadThai += `ความดันโลหิต ${data.sbp}/${data.dbp} มม.ปรอท `;
    }
    if (data?.rr) {
      payloadThai += `อัตราการหายใจ ${data.rr} ครั้ง/นาที `;
    }
    if (data?.hr) {
      payloadThai += `อัตราการเต้นของหัวใจ ${data.hr} ครั้ง/นาที `;
    }
    if (data?.temp) {
      payloadThai += `อุณหภูมิร่างกาย ${data.temp} °C `;
    }
    if (data?.coma) {
      payloadThai += `ระดับความรู้สึกตัว ${data.coma} `;
    }
    if (data?.cc) {
      payloadThai += `มีอาการสำคัญคือ ${data.cc} `;
    }
    if (data?.pi) {
      payloadThai += `ประวัติการเจ็บป่วยคือ ${data.pi} `;
    }
    if (data?.pmh) {
      payloadThai += `มีโรคประจำตัวคือ ${data.pmh} `;
    }
    if (data?.progressNotes) {
      payloadThai += `อาการและการดำเนินโรคระหว่างการรักษาเป็นดังนี้: ${data.progressNotes} `;
    }
    if (data?.labResults) {
      payloadThai += `ผลการตรวจทางห้องปฏิบัติการที่สำคัญได้แก่ ${data.labResults} `;
    }
    if (data?.imagingReports) {
      payloadThai += `ผลการตรวจทางรังสีวิทยาที่สำคัญได้แก่ ${data.imagingReports} `;
    }
    if (data?.operativeNotes) {
      payloadThai += `การผ่าตัดที่สำคัญได้แก่ ${data.operativeNotes} `;
    }
    if (data?.procedures) {
      payloadThai += `ขั้นตอนการรักษาที่สำคัญได้แก่ ${data.procedures} `;
    }
    if (data?.inHospitalMeds) {
      payloadThai += `ยาที่ได้รับระหว่างรักษาได้แก่ ${data.inHospitalMeds} `;
    }
    if (data?.dischargeMeds) {
      payloadThai += `ยาที่ได้รับเมื่อจำหน่ายได้แก่ ${data.dischargeMeds} `;
    }
    if (data?.pdx) {
      payloadThai += `โรคหลักที่วินิจฉัยคือ ${data.pdx} `;
    }
    if (data?.sdx) {
      payloadThai += `โรคร่วม/แทรกซ้อนที่วินิจฉัยคือ ${data.sdx} `;
    }
    if (data?.procedure) {
      payloadThai += `หัตถการที่วินิจฉัยคือ ${data.procedure} `;
    }

    console.log('PayloadThai to AI API:', payloadThai);

    let systemMessageEnglish = "You are a Medical Coder AI expert. Analyze the patient information and summarize the results in JSON format only, with the following keys: discharge_summary, principal_diagnosis, icd_10_pdx, secondary_diagnosis (if none, put None), procedure.";
    let payloadEnglish = '';
    if (data?.sex) {
      payloadEnglish += `Patient is ${data.sex === 'ชาย' ? 'male' : 'female'} `;
    }
    if (data?.age) {
      payloadEnglish += `Age ${data.age} years old `;
    }
    if (data?.weight) {
      payloadEnglish += `Weight ${data.weight} kg `;
    }
    if (data?.height) {
      payloadEnglish += `Height ${data.height} cm `;
    }
    if (data?.sbp && data?.dbp) {
      payloadEnglish += `Blood pressure ${data.sbp}/${data.dbp} mmHg `;
    }
    if (data?.rr) {
      payloadEnglish += `Respiratory rate ${data.rr} breaths/minute `;
    }
    if (data?.hr) {
      payloadEnglish += `Heart rate ${data.hr} beats/minute `;
    }
    if (data?.temp) {
      payloadEnglish += `Body temperature ${data.temp} °C `;
    }
    if (data?.coma) {
      payloadEnglish += `Coma scale ${data.coma} `;
    }
    if (data?.cc) {
      payloadEnglish += `Chief complaint is ${data.cc} `;
    }
    if (data?.pi) {
      payloadEnglish += `History of present illness is ${data.pi} `;
    }
    if (data?.pmh) {
      payloadEnglish += `Past medical history includes ${data.pmh} `;
    }
    if (data?.progressNotes) {
      payloadEnglish += `Progress notes during admission are as follows: ${data.progressNotes} `;
    }
    if (data?.labResults) {
      payloadEnglish += `Significant laboratory results include ${data.labResults} `;
    }
    if (data?.imagingReports) {
      payloadEnglish += `Significant imaging findings include ${data.imagingReports} `;
    }
    if (data?.operativeNotes) {
      payloadEnglish += `Significant operative notes include ${data.operativeNotes} `;
    }
    if (data?.procedures) {
      payloadEnglish += `Significant procedures include ${data.procedures} `;
    }
    if (data?.inHospitalMeds) {
      payloadEnglish += `Medications administered during hospitalization include ${data.inHospitalMeds} `;
    }
    if (data?.dischargeMeds) {
      payloadEnglish += `Medications prescribed at discharge include ${data.dischargeMeds} `;
    }
    if (data?.pdx) {
      payloadEnglish += `Primary diagnosis is ${data.pdx} `;
    }
    if (data?.sdx) {
      payloadEnglish += `Secondary/complicating diagnoses include ${data.sdx} `;
    }
    if (data?.procedure) {
      payloadEnglish += `Performed procedures include ${data.procedure} `;
    }
    console.log('PayloadEnglish to AI API:', payloadEnglish);
    this.aiContent = payloadEnglish.replace(/[\r\n]+/g, ' ').trim();
    console.log(this.aiContent)
    this.aiPrompt.set({ system: systemMessageEnglish, user: this.aiContent });
    const result: any = await this.aiService.aiProcess({
      system: systemMessageEnglish,
      user: this.aiContent,
      data
    });
    this.aiResponse.set(result);
    if (Array.isArray(this.aiResponse()?.choices)) {
      this.aiResponse().choices = this.aiResponse().choices.map((choice: any) => {
        choice.message.content = typeof choice.message.content === 'string' ? JSON.parse(choice.message.content) : choice.message.content;
        return choice;
      });
    }
    console.log('AI API result:', result);
    this.toastr.info(result?.status || result?.message || result?.id, result?.choices ? 'Success!' : 'Failed!', { position: 'bottom-right', progress: true });
    this.activeTab.set('ai-result');
    this.isLoading.set(false);
  }
}

const aiUserContents = "ผู้ป่วยหญิง อายุ 70 ปี ความดันโลหิต 94/41 มม.ปรอท อัตราการหายใจ 28 ครั้ง/นาที อัตราการเต้นของหัวใจ 98 ครั้ง/นาที อุณหภูมิร่างกาย 36.7 °C ประวัติการเจ็บป่วยคือ Off service note 27/2/69 (If D/C pls notify endocrine, neuromed, ENT) U/D - T2DM, HT, DLP, vit D def F/U endocrine - old CVA status bedridden F/U neuro อ.เกษมสิน - S/P TT F/U ENT - NSAA F/U hemato อ ธนกฤต - pathologic fx at rt distal humerous F/U ortho 14/11/68 (loss F/U) Last admit วันที่ 14-25/9/68 ด้วย A baum MDR (mero+sitafloxacin 10 days), septic ATN , pathologic fx at rt distal humerous มาเจาะเลือดตามนัด endo พบ AKI + hypercalcemia จึงแนะนำให้มา admit 21/11/68 problem list (service 2/69) 1. AKI dueto septic ATN septic w/u 10/2/69 HCx2: Acinetobacter nosocomialis (CRBSI) TSC C/S: A.baum, KP, KP (ไม่ได้ทำ drug sense เพิ่ม) CXR no infiltration ATB: sulbactam+Tigecycline 11/2/69-21/2/69 >>> ไข้ลดลงดี กลับมา re-HD via Lt FV 13/2/69 plan รอ renal recovery 2. UGIB 23/2/69 NG: coffee ground จางๆ 50 ml ล่าสุด on losec 1x2 ยังไม่ได้ scope ผลการตรวจทางห้องปฏิบัติการที่สำคัญได้แก่ 04017 Hemoculture I* *** Preminary Report *** Specimen : Hemoculture I Specimen site : p-line Test Name : Hemoculture I Hemo culture : No growth after 24 hrs. Reported By : Mr.Prawatsak Senamontree MT7485 Reported Date/Time : 19/05/2026 17:02:11 Approved By : Miss.Krittika Kamlangharn, MT8688 Approved Date/Time : 19/05/2026 17:02:11 04018 Hemoculture II* *** Preminary Report *** Specimen : Hemoculture II Specimen site : c-line Test Name : Hemoculture II Hemo culture : No growth after 24 hrs. Reported By : Mr.Prawatsak Senamontree MT7485 Reported Date/Time : 19/05/2026 17:02:11 Approved By : Miss.Krittika Kamlangharn, MT8688 Approved Date/Time : 19/05/2026 17:02:11 IPD19 พ.ค. 2569 15:28 [MICU 4] Lab No: 690277651 (19 ชั่วโมงที่แล้ว) พิมพ์ 04102 Fluorescence AFB Day 2* Specimen : Tracheal suction Test Name : Fluorescence AFB Day 2 Fluorescence AFB Day 2 : Not Found Reported By : ทนพญ.ปิยธิดา นครศรี ทน.22874 Reported Date/Time : 19/05/2026 15:28:34 Approved By : ทนพญ.ปิยธิดา นครศรี ทน.22874 Approved Date/Time : 19/05/2026 15:28:35 IPD19 พ.ค. 2569 07:22 [MICU 4] Lab No: 690276202 (1 วันที่แล้ว) พิมพ์ หมายเหตุ: 19/5/69 06.00 02002	Blood Urea Nitrogen*	55 	5.8-19.1 mg/dL 02003-01	Creatinine*	4.23 	0.51-0.95 mg/dL 02003-02	eGFR	10 	>= 90 02075	Sodium*	136	130-147 mmol/L 02076	Potassium*	4.79 	3.4-4.7 mmol/L 02108	Chloride*	98	96-107 mmol/L 02109	CO2*	22.5	20.6-28.3 mmol/L 07001-02	WBC	11.2 	4.5-10 10^3/uL 07001-04	RBC	2.80 	4.2-5.5 10^6/uL 07001-06	Hemoglobin	8.0 	12-16 g/dL 07001-07	Hematocrit	24.9 	37-47 % 07001-08	MCV	88.9	80-100 fL 07001-09	MCH	28.6	26-34 pg 07001-10	MCHC	32.1	31-37 g/dL 07001-11	RDW	24.5 	11.9-14.8 % 07001-12	PLT	204	140-400 10^3/uL 07001-13	MPV	11.4 	6.7-10.2 fL 07001-14	PLT Smear	Adequate	 07001-17	NRBC	1	Cells/100 WBC 07001-18	WBC Differential by	Automation	 07001-19	Neutrophil %	84.7 	43.7-70.9 % 07001-20	Lymphocyte %	6.9 	20.1-44.5 % 07001-21	Monocyte %	8.3	3.4-9.8 % 07001-22	Eosinophil %	0.0 	0.7-9.2 % 07001-23	Basophil %	0.1	0-2.6 % 07001-32	Total Differential	100	 07001-35	Anisocytosis	1+	 07001-36	Poikilocytosis	Few	 07001-37	Microcyte	Few	 07001-38	Macrocyte	Few	 07001-39	Target cell	1+	 07001-40	Polychromasia	2+	 07001-43	Basophilic Stippling	Found	 IPD18 พ.ค. 2569 22:49 [MICU 4] Lab No: 690275797 (1 วันที่แล้ว) พิมพ์ 04078-01	Specimen	Stool	 04078-03	GDH	Negative	Negative 04078-04	Toxin A	Negative	Negative 04078-05	Toxin B	Negative	Negative 06010-01	Color	Yellow	 06010-03	Consistency	Soft	 06010-05	Concentration Exam	Stool simple sedimentation	 06010-06	RBC	None	Cells/HPF 06010-07	WBC	None	Cells/HPF 06010-08	Yeast	Not found	 06010-09	Fat droplet	Not found	/HPF 06010-12	Protozoa	Not found	 06010-13	Parasite	Not found	 ผลการตรวจทางรังสีวิทยาที่สำคัญได้แก่ Pathology Gross Specimen  consists  of  two  pieces  of  bone  marrow,  measuring  0.7  cm. (A)   Microscopic      Cellularity  :  Cell  :  Fat  ratio  =  10  :  90,  Myeloid  :  Erythroid  ratio  =  3  :  1.      Erythroid  morphology  :  Unremarkable.      Myeloid  morphology  :  Unremarkable.      Megakaryocyte  :  Decreased.	      Megakaryocyte  morphology  :  Unremarkable.      Lymphoid  cells  :  Not increased.      Plasma  cells  :  Not  increased.      Fibrosis  :  Absent.      Granuloma  :  Absent. Diagnosis Bone  marrow,  biopsy  :-      -  Markedly hypocellular trilineage marrow with normal maturation. ยาที่ได้รับระหว่างรักษาได้แก่  (Androlic) OxyMETHOLONE 50 MG TAB:E1, [OXMTT1]   178 รายการ (Fortum) cefTAZidime 1 GM./VIAL INJ. :E2, [CTZDI1]   27 รายการ (LETTA) LevETIRAcetam 500 MG TAB :E2, [LVTRT2]   181 รายการ (Nimbex)CISatraCURIUM 10 MG/5ML INJ *:E1, [CSTCI2]   1 รายการ (ผง)AcetylCYSteine POW 200 MG (Acetin):N1, [ACTP1]   96 รายการ (เม็ด) VANCOmyCIN 125 MG CAP(VANCIN):N1, [VCMCT1]   11 รายการ (เลโวเฟด) NorEpinePhrine 4mg/4ml :E1, [NEPNI1]   40 รายการ 0.9%sodium chloride 5 cc (1 tube), [NSS5]   5 รายการ 20% HUMAN ALBUMIN INJ., 50 ML (10GM/VIAL):N1, [ABMI1]   236 รายการ 50% MAGNESIUM SULFATE 2 ML [8.12mEq] INJ ** E1, [MNSSI2]   8 รายการ ACETATED RINGER SOL.1000 ML:E1, [ACTRI1]   6 รายการ AMIKACIN 500 MG/2ML INJ (Amikin) :E1, [AMKCI2]   31 รายการ ATORvastatin 40 mg (LIPITOR):E2, [ATVTT2]   170 รายการ CAL. POLYSTYRENE 5 G Pwdr.(Kalimate) :E1, [KLMP1]   25 รายการ CHLORPHENIRAMINE 10 MG/ML INJ.(CPM) :E1, [CPMI1]   2 รายการ CIPROFLOXACIN 200 MG/100ML Inj. :E2, [CPFXI1]   6 รายการ CLOPIDOGREL 75 MG TAB (L):E1, [CPDGT1]   85 รายการ COLISTIMETHATE 150 MG INJ. (Colistin) :E1, [CLTI1]   61 รายการ Calcium CARBONATE 1000 MG TAB :E1, [CCCBT2]   101 รายการ Calcium GLUCONATE10%W/V10ml ** E1, [CCGCI1]   2 รายการ CloNAzePAM 0.5 MG TAB(Rivotril):E1, [CNZPT1]   51 รายการ Co-triMOXazole 80+400 MG/5ML INJ :E1, [CTMXI1]   7 รายการ D-5-S/2 INJ 1000ML:E1, [D5S2I1]   3 รายการ D-5-W INJ 1000ML:E1, [D5WI1]   1 รายการ D-5-W INJ 100ML:E1, [D5WI3]   197 รายการ D-5-W INJ 250 ML:E1, [D5WI5]   25 รายการ D-5-W INJ 50 ML:E1, [D5WI4]   3 รายการ DERMO SHAMPOO 120 ML.:E1, [DMSPE1]   45 รายการ FENTANYL 100 MCG/2ML INJ :E2, [FTNI1]   4 รายการ FUROSEMIDE 250 MG/25ML INJ. (Lasix) :E1, [FRSMI2]   6 รายการ FoLic acid 5 MG TAB [โฟลิค] :E1, [FLACT1]   181 รายการ GLYCOPHOS CONCENTRATE 20 ML/VIAL:E2, [GCPCI1]   1 รายการ Glucose 50% INJ. 50 ML :E1, [GCI1]   24 รายการ HISTA-OPH EYE DROP 10 ML. :E1, [HTOE1]   18 รายการ HYDROCORTISONE 100 MG/2ML INJ.:E1, [HDCTI1]   8 รายการ IPRATROPIUM/FENOTEROL(INHALEX FORTE):E2, [IHLE1]   49 รายการ Insulin! (HUMULIN-N 100 IU/ML INJ.** E1, [HMLNI1]   258 รายการ Insulin! (HUMULIN-R 100 IU/ML INJ. ** E1, [HMLRI1]   157 รายการ KETOCONAZOLE 2% +VIT.B5 SHAMPOO(DEZOR)120ML:N1/N4, [KTCNE4]   20 รายการ LACTULOSE LIQUID10 MG/15ML 100 ML :E1, [LTLL4]   9 รายการ MEROPENEM 1 G :E2, [MRPNI3]   85 รายการ MORPHINE HCL INJ 3MG/3ML ** :E1, [MPI3]   15 รายการ NO MED, [NM1]   3 รายการ NSS 100ML :E1, [NSSI6]   148 รายการ Norepinephrine inj. (4 mcg /ml) 50 ML (ผลิต), [NEPNI2]   1 รายการ OMEPrazole 20 MG CAP (โอมีพาโซล) :E1, [OMPZT1]   125 รายการ OMEPrazole 40 MG INJ (Losec) :E1, [OMPZI3]   34 รายการ PANTOprazole 40 MG INJ. (Controloc) :E2, [PTPZI1]   7 รายการ PHOSPHATE MIXTURE 30 ml : E1, [PPMTL3]   3 รายการ PIPERACILLIN+TAZOBACTAM 4.5 GM INJ(8:1) :E2, [TZCI1]   55 รายการ POLY-OPH EYE DROP 10 ML. :E1, [PLOE1]   24 รายการ POTASSIUM CHLORIDE 5%-30 ML :E1, [KCLL4]   6 รายการ PREDNISOLONE 5 MG. TAB[เพรดนิโซโลน]:E1, [PNSLT1]   1 รายการ REVIEW MEDICATION DATE ---------------->, [REMED]   213 รายการ SENNOSIDE 7.5 MG TAB(SENOKOT):E1, [SNKT1]   40 รายการ SODAMINT 300 MG TAB.(โซดามิ้น):E1, [SDMT1]   144 รายการ SODIUM BICARBONATE 7.5% IN 50 ML INJ.:E1, [SDBCI1]   1 รายการ SODIUM CHLORIDE 0.9% INJ 1000ML :E1, [NSSI1]   6 รายการ SODIUM CHLORIDE 0.9% INJ 50ML :E1, [NSSI5]   1 รายการ TA MILK 0.02% 120 ML. :E1, [TAME1]   42 รายการ TA SCALP 0.02% LOTION 120 ML :E1, [TASCE1]   45 รายการ TIGEcycline 50 MG INJECTION (TyGACIL) N1, [TGCCI1]   12 รายการ TIZANidine HCL 2 MG TAB (Sirdalud):E1:, [TZNDT1]   83 รายการ TRANEXAMIC ACID INJ. 250 MG/5ML :E1, [TNXMI1]   6 รายการ VANCOMYCIN 500 MG INJ. :E2, [VCMCI1]   10 รายการ Vitamin B COmplex TAB.[วิตามินบีรวม]:E1, [VTMBT7]   132 รายการ Vitamin D2 20,000 IU. CAP.[วิตามินดี]:E1, [VTMDT2]   47 รายการ ZINC PASTE 10 GM:E1, [ZPE2]   36 รายการ dexAMETHasone 4 MG/ML INJ. :E1, [DXMTI1]   1 รายการ furosemide 20 MG/2ML INJ (Lasix) :E1, [FRSMI1]   9 รายการ hydrALAZINE 25 mg. TAB.(ไฮดาลาซิน):E1, [HDLZT2]   1 รายการ maniDIPINE 20 MG TAB(madiplot):E2, [MNDPT2]   8 รายการ metoCLOPRAMIDE 10 MG/2ML INJ. :E1, [MTCPI1]   24 รายการ suLBACTAM 2 G INJ:N1, [SBTI2]   25 รายการ  ipd-ai-summary.ts:315 PayloadEnglish to AI API: Patient is female Age 70 years old Blood pressure 94/41 mmHg Respiratory rate 28 breaths/minute Heart rate 98 beats/minute Body temperature 36.7 °C History of present illness is Off service note 27/2/69 (If D/C pls notify endocrine, neuromed, ENT) U/D - T2DM, HT, DLP, vit D def F/U endocrine - old CVA status bedridden F/U neuro อ.เกษมสิน - S/P TT F/U ENT - NSAA F/U hemato อ ธนกฤต - pathologic fx at rt distal humerous F/U ortho 14/11/68 (loss F/U) Last admit วันที่ 14-25/9/68 ด้วย A baum MDR (mero+sitafloxacin 10 days), septic ATN , pathologic fx at rt distal humerous มาเจาะเลือดตามนัด endo พบ AKI + hypercalcemia จึงแนะนำให้มา admit 21/11/68 problem list (service 2/69) 1. AKI dueto septic ATN septic w/u 10/2/69 HCx2: Acinetobacter nosocomialis (CRBSI) TSC C/S: A.baum, KP, KP (ไม่ได้ทำ drug sense เพิ่ม) CXR no infiltration ATB: sulbactam+Tigecycline 11/2/69-21/2/69 >>> ไข้ลดลงดี กลับมา re-HD via Lt FV 13/2/69 plan รอ renal recovery 2. UGIB 23/2/69 NG: coffee ground จางๆ 50 ml ล่าสุด on losec 1x2 ยังไม่ได้ scope Significant laboratory results include 04017 Hemoculture I* *** Preminary Report *** Specimen : Hemoculture I Specimen site : p-line Test Name : Hemoculture I Hemo culture : No growth after 24 hrs. Reported By : Mr.Prawatsak Senamontree MT7485 Reported Date/Time : 19/05/2026 17:02:11 Approved By : Miss.Krittika Kamlangharn, MT8688 Approved Date/Time : 19/05/2026 17:02:11 04018 Hemoculture II* *** Preminary Report *** Specimen : Hemoculture II Specimen site : c-line Test Name : Hemoculture II Hemo culture : No growth after 24 hrs. Reported By : Mr.Prawatsak Senamontree MT7485 Reported Date/Time : 19/05/2026 17:02:11 Approved By : Miss.Krittika Kamlangharn, MT8688 Approved Date/Time : 19/05/2026 17:02:11 IPD19 พ.ค. 2569 15:28 [MICU 4] Lab No: 690277651 (19 ชั่วโมงที่แล้ว) พิมพ์ 04102 Fluorescence AFB Day 2* Specimen : Tracheal suction Test Name : Fluorescence AFB Day 2 Fluorescence AFB Day 2 : Not Found Reported By : ทนพญ.ปิยธิดา นครศรี ทน.22874 Reported Date/Time : 19/05/2026 15:28:34 Approved By : ทนพญ.ปิยธิดา นครศรี ทน.22874 Approved Date/Time : 19/05/2026 15:28:35 IPD19 พ.ค. 2569 07:22 [MICU 4] Lab No: 690276202 (1 วันที่แล้ว) พิมพ์ หมายเหตุ: 19/5/69 06.00 02002	Blood Urea Nitrogen*	55 	5.8-19.1 mg/dL 02003-01	Creatinine*	4.23 	0.51-0.95 mg/dL 02003-02	eGFR	10 	>= 90 02075	Sodium*	136	130-147 mmol/L 02076	Potassium*	4.79 	3.4-4.7 mmol/L 02108	Chloride*	98	96-107 mmol/L 02109	CO2*	22.5	20.6-28.3 mmol/L 07001-02	WBC	11.2 	4.5-10 10^3/uL 07001-04	RBC	2.80 	4.2-5.5 10^6/uL 07001-06	Hemoglobin	8.0 	12-16 g/dL 07001-07	Hematocrit	24.9 	37-47 % 07001-08	MCV	88.9	80-100 fL 07001-09	MCH	28.6	26-34 pg 07001-10	MCHC	32.1	31-37 g/dL 07001-11	RDW	24.5 	11.9-14.8 % 07001-12	PLT	204	140-400 10^3/uL 07001-13	MPV	11.4 	6.7-10.2 fL 07001-14	PLT Smear	Adequate	 07001-17	NRBC	1	Cells/100 WBC 07001-18	WBC Differential by	Automation	 07001-19	Neutrophil %	84.7 	43.7-70.9 % 07001-20	Lymphocyte %	6.9 	20.1-44.5 % 07001-21	Monocyte %	8.3	3.4-9.8 % 07001-22	Eosinophil %	0.0 	0.7-9.2 % 07001-23	Basophil %	0.1	0-2.6 % 07001-32	Total Differential	100	 07001-35	Anisocytosis	1+	 07001-36	Poikilocytosis	Few	 07001-37	Microcyte	Few	 07001-38	Macrocyte	Few	 07001-39	Target cell	1+	 07001-40	Polychromasia	2+	 07001-43	Basophilic Stippling	Found	 IPD18 พ.ค. 2569 22:49 [MICU 4] Lab No: 690275797 (1 วันที่แล้ว) พิมพ์ 04078-01	Specimen	Stool	 04078-03	GDH	Negative	Negative 04078-04	Toxin A	Negative	Negative 04078-05	Toxin B	Negative	Negative 06010-01	Color	Yellow	 06010-03	Consistency	Soft	 06010-05	Concentration Exam	Stool simple sedimentation	 06010-06	RBC	None	Cells/HPF 06010-07	WBC	None	Cells/HPF 06010-08	Yeast	Not found	 06010-09	Fat droplet	Not found	/HPF 06010-12	Protozoa	Not found	 06010-13	Parasite	Not found	 Significant imaging findings include Pathology Gross Specimen  consists  of  two  pieces  of  bone  marrow,  measuring  0.7  cm. (A)   Microscopic      Cellularity  :  Cell  :  Fat  ratio  =  10  :  90,  Myeloid  :  Erythroid  ratio  =  3  :  1.      Erythroid  morphology  :  Unremarkable.      Myeloid  morphology  :  Unremarkable.      Megakaryocyte  :  Decreased.	      Megakaryocyte  morphology  :  Unremarkable.      Lymphoid  cells  :  Not increased.      Plasma  cells  :  Not  increased.      Fibrosis  :  Absent.      Granuloma  :  Absent. Diagnosis Bone  marrow,  biopsy  :-      -  Markedly hypocellular trilineage marrow with normal maturation. Medications administered during hospitalization include  (Androlic) OxyMETHOLONE 50 MG TAB:E1, [OXMTT1]   178 รายการ (Fortum) cefTAZidime 1 GM./VIAL INJ. :E2, [CTZDI1]   27 รายการ (LETTA) LevETIRAcetam 500 MG TAB :E2, [LVTRT2]   181 รายการ (Nimbex)CISatraCURIUM 10 MG/5ML INJ *:E1, [CSTCI2]   1 รายการ (ผง)AcetylCYSteine POW 200 MG (Acetin):N1, [ACTP1]   96 รายการ (เม็ด) VANCOmyCIN 125 MG CAP(VANCIN):N1, [VCMCT1]   11 รายการ (เลโวเฟด) NorEpinePhrine 4mg/4ml :E1, [NEPNI1]   40 รายการ 0.9%sodium chloride 5 cc (1 tube), [NSS5]   5 รายการ 20% HUMAN ALBUMIN INJ., 50 ML (10GM/VIAL):N1, [ABMI1]   236 รายการ 50% MAGNESIUM SULFATE 2 ML [8.12mEq] INJ ** E1, [MNSSI2]   8 รายการ ACETATED RINGER SOL.1000 ML:E1, [ACTRI1]   6 รายการ AMIKACIN 500 MG/2ML INJ (Amikin) :E1, [AMKCI2]   31 รายการ ATORvastatin 40 mg (LIPITOR):E2, [ATVTT2]   170 รายการ CAL. POLYSTYRENE 5 G Pwdr.(Kalimate) :E1, [KLMP1]   25 รายการ CHLORPHENIRAMINE 10 MG/ML INJ.(CPM) :E1, [CPMI1]   2 รายการ CIPROFLOXACIN 200 MG/100ML Inj. :E2, [CPFXI1]   6 รายการ CLOPIDOGREL 75 MG TAB (L):E1, [CPDGT1]   85 รายการ COLISTIMETHATE 150 MG INJ. (Colistin) :E1, [CLTI1]   61 รายการ Calcium CARBONATE 1000 MG TAB :E1, [CCCBT2]   101 รายการ Calcium GLUCONATE10%W/V10ml ** E1, [CCGCI1]   2 รายการ CloNAzePAM 0.5 MG TAB(Rivotril):E1, [CNZPT1]   51 รายการ Co-triMOXazole 80+400 MG/5ML INJ :E1, [CTMXI1]   7 รายการ D-5-S/2 INJ 1000ML:E1, [D5S2I1]   3 รายการ D-5-W INJ 1000ML:E1, [D5WI1]   1 รายการ D-5-W INJ 100ML:E1, [D5WI3]   197 รายการ D-5-W INJ 250 ML:E1, [D5WI5]   25 รายการ D-5-W INJ 50 ML:E1, [D5WI4]   3 รายการ DERMO SHAMPOO 120 ML.:E1, [DMSPE1]   45 รายการ FENTANYL 100 MCG/2ML INJ :E2, [FTNI1]   4 รายการ FUROSEMIDE 250 MG/25ML INJ. (Lasix) :E1, [FRSMI2]   6 รายการ FoLic acid 5 MG TAB [โฟลิค] :E1, [FLACT1]   181 รายการ GLYCOPHOS CONCENTRATE 20 ML/VIAL:E2, [GCPCI1]   1 รายการ Glucose 50% INJ. 50 ML :E1, [GCI1]   24 รายการ HISTA-OPH EYE DROP 10 ML. :E1, [HTOE1]   18 รายการ HYDROCORTISONE 100 MG/2ML INJ.:E1, [HDCTI1]   8 รายการ IPRATROPIUM/FENOTEROL(INHALEX FORTE):E2, [IHLE1]   49 รายการ Insulin! (HUMULIN-N 100 IU/ML INJ.** E1, [HMLNI1]   258 รายการ Insulin! (HUMULIN-R 100 IU/ML INJ. ** E1, [HMLRI1]   157 รายการ KETOCONAZOLE 2% +VIT.B5 SHAMPOO(DEZOR)120ML:N1/N4, [KTCNE4]   20 รายการ LACTULOSE LIQUID10 MG/15ML 100 ML :E1, [LTLL4]   9 รายการ MEROPENEM 1 G :E2, [MRPNI3]   85 รายการ MORPHINE HCL INJ 3MG/3ML ** :E1, [MPI3]   15 รายการ NO MED, [NM1]   3 รายการ NSS 100ML :E1, [NSSI6]   148 รายการ Norepinephrine inj. (4 mcg /ml) 50 ML (ผลิต), [NEPNI2]   1 รายการ OMEPrazole 20 MG CAP (โอมีพาโซล) :E1, [OMPZT1]   125 รายการ OMEPrazole 40 MG INJ (Losec) :E1, [OMPZI3]   34 รายการ PANTOprazole 40 MG INJ. (Controloc) :E2, [PTPZI1]   7 รายการ PHOSPHATE MIXTURE 30 ml : E1, [PPMTL3]   3 รายการ PIPERACILLIN+TAZOBACTAM 4.5 GM INJ(8:1) :E2, [TZCI1]   55 รายการ POLY-OPH EYE DROP 10 ML. :E1, [PLOE1]   24 รายการ POTASSIUM CHLORIDE 5%-30 ML :E1, [KCLL4]   6 รายการ PREDNISOLONE 5 MG. TAB[เพรดนิโซโลน]:E1, [PNSLT1]   1 รายการ REVIEW MEDICATION DATE ---------------->, [REMED]   213 รายการ SENNOSIDE 7.5 MG TAB(SENOKOT):E1, [SNKT1]   40 รายการ SODAMINT 300 MG TAB.(โซดามิ้น):E1, [SDMT1]   144 รายการ SODIUM BICARBONATE 7.5% IN 50 ML INJ.:E1, [SDBCI1]   1 รายการ SODIUM CHLORIDE 0.9% INJ 1000ML :E1, [NSSI1]   6 รายการ SODIUM CHLORIDE 0.9% INJ 50ML :E1, [NSSI5]   1 รายการ TA MILK 0.02% 120 ML. :E1, [TAME1]   42 รายการ TA SCALP 0.02% LOTION 120 ML :E1, [TASCE1]   45 รายการ TIGEcycline 50 MG INJECTION (TyGACIL) N1, [TGCCI1]   12 รายการ TIZANidine HCL 2 MG TAB (Sirdalud):E1:, [TZNDT1]   83 รายการ TRANEXAMIC ACID INJ. 250 MG/5ML :E1, [TNXMI1]   6 รายการ VANCOMYCIN 500 MG INJ. :E2, [VCMCI1]   10 รายการ Vitamin B COmplex TAB.[วิตามินบีรวม]:E1, [VTMBT7]   132 รายการ Vitamin D2 20,000 IU. CAP.[วิตามินดี]:E1, [VTMDT2]   47 รายการ ZINC PASTE 10 GM:E1, [ZPE2]   36 รายการ dexAMETHasone 4 MG/ML INJ. :E1, [DXMTI1]   1 รายการ furosemide 20 MG/2ML INJ (Lasix) :E1, [FRSMI1]   9 รายการ hydrALAZINE 25 mg. TAB.(ไฮดาลาซิน):E1, [HDLZT2]   1 รายการ maniDIPINE 20 MG TAB(madiplot):E2, [MNDPT2]   8 รายการ metoCLOPRAMIDE 10 MG/2ML INJ. :E1, [MTCPI1]   24 รายการ suLBACTAM 2 G INJ:N1, [SBTI2]   25 รายการ"

/*
เหนื่อยมากขึ้น เบื่ออาหาร ปวดเอวมาก มียาแก้ปวดพอทุเลา เดินได้สะดวก 

Case CA Rectum
S/P LAR 28/10/65 @KKH
Patho : Rectosigmoid colon, resection: 28/10/2565
- Adenocarcinoma, moderately differentiated, invading through muscular layer into pericolic fat.


reverse A/G ratio r/o MM
Diagnosis : CA colon S/P surgery
Patho : 1. Rectosigmoid colon, resection:
- Adenocarcinoma, moderately differentiated, invading through muscular layer into pericolic fat.
- No angiolymphatic invasion.
- Free proximal, distal and radial resected margins.
- No metastatic carcinoma in all sixteen pericolic lymph nodes (0/16).


Lab Cr 1.89
Uric 11.3
Alb 3.6 Glob 9.2
Na 128 K 3.8 Ca 11.3
Hb 6.7 Hct 20.6 Plt 151000
Imp: MM with anemia and hypercalcemia AKI
Mx: Admit for hydration and blood transfusion


BMA : No adequate
Bone marrow, biopsy:
- Hypercellular marrow (approximately 70%) with atypical plasma cells with immature nuclei proliferation substituting normal hematopoietic cells (see NOTE).

NOTE: Immunohistochemical studies for CD138, Kappa and Lambda are pending.
Addendum 1
- Consistent with marrow involvement by plasma cell neoplasm, supported by immunohistochemistry
- Immunohistochemical studies show CD138-highlighted plasma cells (90%) with Kappa light chain restriction (Kappa:Lambda ratio more than 20:1).

SPEP 21/4/69 : Monoclonal gammopathy (TP 13 g/dl, M spike 5.0 g/dl)


*/