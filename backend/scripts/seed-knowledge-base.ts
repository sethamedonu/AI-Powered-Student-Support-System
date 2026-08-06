#!/usr/bin/env node
/**
 * seed-knowledge-base.ts
 *
 * Hybrid seeding script that:
 * 1. Creates sample PDF documents with UCC content
 * 2. Uploads them to S3 (aisss-dev-knowledge-docs bucket)
 * 3. Populates DynamoDB with structured Q&A entries
 * 4. Triggers Bedrock KB ingestion
 *
 * Usage:
 *   npm run seed:kb
 *   # or with options:
 *   ts-node scripts/seed-knowledge-base.ts --skip-s3
 *   ts-node scripts/seed-knowledge-base.ts --skip-dynamodb
 *   ts-node scripts/seed-knowledge-base.ts --dry-run
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { 
  BedrockAgentClient, 
  StartIngestionJobCommand 
} from '@aws-sdk/client-bedrock-agent';
import { randomUUID } from 'node:crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ─── Configuration ────────────────────────────────────────────────────────────
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const KNOWLEDGE_DOCS_BUCKET = process.env.KNOWLEDGE_DOCS_BUCKET;
const DYNAMODB_TABLE_KNOWLEDGE = process.env.DYNAMODB_TABLE_KNOWLEDGE;
const BEDROCK_KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
const BEDROCK_KNOWLEDGE_DATA_SOURCE_ID = process.env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID;

const SKIP_S3 = process.argv.includes('--skip-s3');
const SKIP_DYNAMODB = process.argv.includes('--skip-dynamodb');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── AWS Clients ──────────────────────────────────────────────────────────────
const s3Client = new S3Client({ region: AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
const bedrockClient = new BedrockAgentClient({ region: AWS_REGION });

// ─── Sample Knowledge Data ────────────────────────────────────────────────────

interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  // ─── ADMISSIONS ───────────────────────────────────────────────────────────
  {
    category: 'admissions',
    title: 'General Admission Requirements',
    content: `University of Cape Coast (UCC) admission requirements:

1. MINIMUM QUALIFICATIONS
   - WASSCE/SSSCE with credits (A1-C6) in 6 subjects including English and Mathematics
   - Core subjects: English, Mathematics, Integrated Science, Social Studies
   - At least credit passes (A-D) in three elective subjects relevant to chosen programme

2. AGGREGATE REQUIREMENTS
   - Aggregate 6-24 for most programmes
   - Aggregate 6-15 for competitive programmes (Medicine, Law, Engineering)
   - Specific programmes may have additional requirements

3. MATURE STUDENTS
   - Must be 25 years or older
   - Pass mature students' entrance examination
   - Relevant work experience considered

4. INTERNATIONAL STUDENTS
   - Equivalent qualifications from recognized institutions
   - English proficiency test (TOEFL/IELTS) if applicable
   - Valid passport and study permit

For detailed programme-specific requirements, visit the admissions office or check the UCC prospectus.`,
    keywords: ['admission', 'requirements', 'WASSCE', 'SSSCE', 'qualifications', 'aggregate', 'entry']
  },
  {
    category: 'admissions',
    title: 'Application Process and Deadlines',
    content: `UCC APPLICATION PROCESS:

STEP 1: OBTAIN VOUCHER
- Purchase admission voucher from designated banks (GHS 200)
- Online purchase available via UCC portal
- Keep voucher serial number and PIN

STEP 2: COMPLETE ONLINE APPLICATION
- Visit: admissions.ucc.edu.gh
- Create account with voucher details
- Fill all required fields accurately
- Upload scanned documents (certificates, passport photo)

STEP 3: PROGRAMME SELECTION
- Select up to 3 programme choices
- First choice is primary consideration
- Ensure you meet minimum requirements for each choice

STEP 4: SUBMIT APPLICATION
- Review all information carefully
- Pay application fee (included in voucher)
- Print acknowledgement slip for records

KEY DEADLINES:
- Application opens: March 1st
- Regular deadline: June 30th
- Late applications: July 1st - August 15th (additional fee applies)
- Admission list publication: September 15th

AFTER SUBMISSION:
- Check admission status regularly on portal
- Admitted students must accept offer within 2 weeks
- Complete registration before academic year begins`,
    keywords: ['application', 'deadline', 'voucher', 'admission process', 'portal', 'submit']
  },
  // ─── REGISTRATION ─────────────────────────────────────────────────────────
  {
    category: 'registration',
    title: 'Course Registration Guide',
    content: `COURSE REGISTRATION AT UCC:

WHEN TO REGISTER:
- Fresh students: First two weeks of semester
- Continuing students: Online registration opens 2 weeks before semester
- Late registration incurs penalty fees

HOW TO REGISTER:

1. ONLINE REGISTRATION (Recommended)
   - Login to Student Portal: students.ucc.edu.gh
   - Navigate to "Course Registration"
   - Select courses from approved list
   - Ensure credit hours meet minimum (12) and maximum (21) requirements
   - Submit for departmental approval

2. CREDIT HOUR LIMITS
   - Minimum: 12 credit hours (full-time status)
   - Maximum: 21 credit hours (with good academic standing)
   - CGPA below 2.0: Maximum 15 credit hours

3. PREREQUISITES
   - System checks for prerequisite completion
   - Cannot register for advanced courses without prerequisites
   - Contact department for prerequisite waivers (if applicable)

4. ADD/DROP PERIOD
   - First two weeks: Add/drop courses freely
   - Week 3-4: Drop with approval (no refund)
   - After week 4: Withdrawal (grade of W, no refund)

5. REGISTRATION CONFIRMATION
   - Print course registration form
   - Submit to departmental office for approval
   - Obtain Head of Department signature
   - Submit final copy to Registry

IMPORTANT: Unregistered students cannot write exams or receive grades.`,
    keywords: ['registration', 'course', 'credit hours', 'add drop', 'prerequisites', 'enroll']
  },
  // ─── TUITION & FEES ───────────────────────────────────────────────────────
  {
    category: 'tuition',
    title: 'Tuition Fees and Payment Options',
    content: `UCC TUITION FEES (2024/2025 Academic Year):

UNDERGRADUATE PROGRAMMES:
- Arts/Social Sciences: GHS 3,500 per semester
- Sciences/Education: GHS 4,200 per semester
- Engineering/Health Sciences: GHS 5,500 per semester
- Medicine: GHS 8,000 per semester

ADDITIONAL FEES:
- Application fee: GHS 200 (one-time)
- Admission fee: GHS 500 (one-time)
- Student activities: GHS 350 per semester
- Medical insurance: GHS 100 per semester
- Examination fees: GHS 400 per semester
- Library services: GHS 50 per semester

ACCOMMODATION (Optional):
- Traditional halls: GHS 800-1,200 per semester
- Hostel accommodation: GHS 1,500-2,500 per semester

PAYMENT METHODS:

1. BANK DEPOSIT
   - GCB Bank, Ecobank, Stanbic Bank (on-campus branches)
   - Use student ID as reference number
   - Obtain and keep payment receipt

2. MOBILE MONEY
   - MTN MoMo: *170# → Pay Bills → UCC
   - Vodafone Cash: Available
   - AirtelTigo Money: Available

3. ONLINE PAYMENT
   - Student portal: students.ucc.edu.gh
   - Credit/Debit cards accepted
   - GhQR payment supported

PAYMENT SCHEDULE:
- Full payment deadline: 4 weeks after resumption
- Installment plan available (3 payments)
- First installment: Before registration
- Final payment: Mid-semester (week 7)

LATE PAYMENT PENALTY:
- 10% late fee after deadline
- Cannot write exams without payment clearance
- Academic transcript withheld until full payment`,
    keywords: ['tuition', 'fees', 'payment', 'cost', 'installment', 'mobile money', 'bank']
  },
  // ─── EXAMINATIONS ─────────────────────────────────────────────────────────
  {
    category: 'examinations',
    title: 'Examination Rules and Procedures',
    content: `UCC EXAMINATION GUIDELINES:

EXAMINATION SCHEDULE:
- Mid-semester exams: Week 7-8
- End-of-semester exams: Week 14-16
- Timetable published 2 weeks before exams
- Check portal regularly for updates

EXAMINATION REQUIREMENTS:

1. ELIGIBILITY
   - Must be registered for the course
   - Attendance: Minimum 75% of lectures
   - All coursework submitted
   - Fees fully paid

2. EXAMINATION ENTRY
   - Collect exam docket from department (1 week before exams)
   - Affix passport photo
   - Submit to department for approval
   - Bring docket to every exam

3. MATERIALS ALLOWED
   - Student ID card (mandatory)
   - Examination docket
   - Stationery (pens, pencils, rulers)
   - Scientific calculator (non-programmable)
   - Approved materials specified by department

EXAMINATION CONDUCT:

• Arrive 15 minutes before exam starts
• No entry after 30 minutes from start time
• No exit within first 30 minutes
• Silence all mobile devices (must be switched off)
• No unauthorized materials on desk
• Raise hand for any assistance
• Stop writing immediately when time is called

PROHIBITED ACTIONS:
❌ Use of mobile phones
❌ Communication with other candidates
❌ Possession of unauthorized materials
❌ Impersonation or identity fraud
❌ Copying or cheating in any form

PENALTIES FOR MISCONDUCT:
- Grade of zero for the paper
- Suspension from exams for one semester
- Expulsion for serious offenses

SPECIAL CIRCUMSTANCES:
- Medical emergencies: Submit medical certificate within 48 hours
- Missed exam: Apply for deferral through department
- Clash of exams: Notify exam office 1 week before`,
    keywords: ['exams', 'examination', 'docket', 'rules', 'timetable', 'conduct', 'eligibility']
  },
  // ─── ACADEMIC CALENDAR ────────────────────────────────────────────────────
  {
    category: 'calendar',
    title: 'Academic Calendar 2024/2025',
    content: `UCC ACADEMIC CALENDAR:

FIRST SEMESTER (August - December 2024):
- August 19: Registration begins
- August 26: Lectures commence
- September 9: Late registration ends (with penalty)
- October 14-18: Mid-semester break
- November 4-8: Mid-semester exams
- December 16-20: End-of-semester exams
- December 21: First semester ends

SECOND SEMESTER (January - May 2025):
- January 13: Registration begins
- January 20: Lectures commence
- February 3: Late registration ends (with penalty)
- March 17-21: Mid-semester break
- April 7-11: Mid-semester exams
- May 19-23: End-of-semester exams
- May 24: Second semester ends

UNIVERSITY HOLIDAYS:
- Independence Day: March 6-7
- Good Friday: April 18
- Easter Monday: April 21
- May Day: May 1
- Founders Day: August 4

IMPORTANT DEADLINES:
- Course registration: First 2 weeks of semester
- Add/Drop period: First 2 weeks
- Withdrawal deadline: Week 8
- Fee payment deadline: Week 4
- Deferral applications: 2 weeks before semester

VACATION PERIODS:
- Long vacation: June - August (10 weeks)
- Christmas break: December 21 - January 12 (3 weeks)

CONGREGATION/GRADUATION:
- November 22-23, 2024 (for 2023/2024 graduates)

Note: Calendar subject to change. Check official UCC website for updates.`,
    keywords: ['calendar', 'semester', 'dates', 'schedule', 'vacation', 'holidays', 'deadline']
  },
  // ─── GRADUATION ───────────────────────────────────────────────────────────
  {
    category: 'graduation',
    title: 'Graduation Requirements and Process',
    content: `UCC GRADUATION REQUIREMENTS:

ACADEMIC REQUIREMENTS:

1. CREDIT COMPLETION
   - Complete all required credit hours for programme
   - Pass all core and elective courses
   - Minimum CGPA: 2.0 (Second Class Lower)

2. CLASSIFICATION OF DEGREES
   - First Class: CGPA 3.60 - 4.00
   - Second Class (Upper): CGPA 3.00 - 3.59
   - Second Class (Lower): CGPA 2.00 - 2.99
   - Pass: CGPA 1.50 - 1.99 (some programmes)

3. ADDITIONAL REQUIREMENTS
   - Complete mandatory internship (if required)
   - Submit project/thesis (if applicable)
   - Clear all financial obligations
   - Return all library books
   - No disciplinary cases pending

GRADUATION APPLICATION:

STEP 1: CHECK ELIGIBILITY
- Verify completion of all requirements via portal
- Request academic transcript review from department
- Resolve any outstanding issues

STEP 2: APPLY FOR GRADUATION
- Login to student portal
- Navigate to "Graduation Application"
- Complete application form
- Pay graduation fees (GHS 500)
- Submit before deadline (usually Week 12 of final semester)

STEP 3: VERIFICATION
- Registry verifies academic records
- Department confirms completion
- Academic Board approves graduation list
- Notification sent to approved candidates

CONGREGATION CEREMONY:
- Date: Annually in November
- Venue: UCC Main Auditorium
- Duration: 3-4 days
- Gowns provided by university
- Guests: Maximum 4 per graduate

AFTER GRADUATION:
- Collect certificate 4-6 weeks after ceremony
- Request official transcripts (GHS 50 each)
- Join UCC Alumni Association`,
    keywords: ['graduation', 'congregation', 'CGPA', 'degree classification', 'certificate', 'requirements']
  },
  // ─── SCHOLARSHIPS ─────────────────────────────────────────────────────────
  {
    category: 'scholarships',
    title: 'Scholarships and Financial Aid',
    content: `UCC SCHOLARSHIPS AND FINANCIAL AID:

1. UNIVERSITY SCHOLARSHIPS

MERIT-BASED SCHOLARSHIPS:
- Chancellor's Scholarship: Full tuition + stipend
  Requirements: CGPA 3.80+, leadership activities
  
- Dean's List Scholarship: 50% tuition reduction
  Requirements: CGPA 3.50+, maintained each semester
  
- Academic Excellence Award: GHS 2,000 per semester
  Requirements: Best student in department (CGPA 3.60+)

NEED-BASED SCHOLARSHIPS:
- Students in Need (SIN) Fund: Up to GHS 3,000
  Requirements: Demonstrated financial need, CGPA 2.5+
  
- Orphans & Vulnerable Children: Full tuition waiver
  Requirements: Submit supporting documents, CGPA 2.0+

2. GOVERNMENT SCHEMES

GHANA SCHOLARSHIP SECRETARIAT:
- Various national scholarships available
- Apply through: www.scholarship.gov.gh
- Deadline: Usually March-April

GETFUND SCHOLARSHIP:
- For top-performing students
- Focus on priority areas (STEM, Education)
- Full tuition + allowances

STUDENT LOAN SCHEME:
- Apply through: www.sltf.gov.gh
- Maximum: Full tuition + GHS 1,500 living expenses
- Repayment starts 1 year after graduation

3. EXTERNAL SCHOLARSHIPS

- MTN Ghana Foundation Scholarship
- Ecobank Scholarship Programme
- Tullow Oil Scholarship Scheme
- Mastercard Foundation Scholars Program

APPLICATION PROCESS:
1. Check eligibility criteria carefully
2. Prepare required documents (transcripts, letters, essays)
3. Submit before deadlines
4. Attend interviews if shortlisted

TIPS FOR SUCCESS:
✓ Apply early
✓ Maintain good academic standing
✓ Get strong recommendation letters
✓ Write compelling personal statements
✓ Apply to multiple opportunities`,
    keywords: ['scholarship', 'financial aid', 'loan', 'funding', 'getfund', 'bursary']
  },
  // ─── CAMPUS SERVICES ──────────────────────────────────────────────────────
  {
    category: 'campus-services',
    title: 'Campus Facilities and Services',
    content: `UCC CAMPUS SERVICES AND FACILITIES:

1. LIBRARY SERVICES
- Sam Jonah Library (Main): 24/7 during exams
- Faculty libraries: Department-specific resources
- E-library: Access to journals, databases, e-books
- Study rooms: Individual and group study spaces
- Computer labs: 200+ computers with internet
- Services: Book loans, reference assistance, photocopying

2. HEALTH SERVICES
- UCC Hospital: 24-hour medical care
- Location: Near Sports Stadium
- Services: Outpatient, dental, eye care, pharmacy
- Emergency: Ambulance available
- Cost: Subsidized for students with insurance
- Counseling: Mental health support available

3. ACCOMMODATION
- Traditional Halls: Adehye, Casford, Valco, Atlantic
- Capacity: 8,000+ students
- Facilities: Dining halls, common rooms, laundry
- Application: Through accommodation portal
- Deadline: 2 weeks after admission

4. SPORTS & RECREATION
- Sports Stadium: Football, athletics track
- Indoor Sports Complex: Basketball, volleyball, table tennis
- Swimming Pool: Olympic-size, lessons available
- Gym: Modern equipment, personal trainers
- Sports clubs: Football, basketball, athletics, etc.

5. BANKING & FINANCIAL
- GCB Bank (On-campus branch)
- Ecobank ATM (Multiple locations)
- Stanbic Bank (Near main gate)
- Mobile money agents throughout campus

6. DINING & CATERING
- University cafeterias (5 locations)
- Hall dining facilities
- Private eateries and restaurants
- Food courts and snack bars
- Meal plans available for hall residents

7. STUDENT SUPPORT
- Counseling Center: Personal, academic, career counseling
- Career Services: Job fairs, CV writing, internships
- Disability Support Office: Accommodations and assistive tech
- Chaplaincy: Religious services and pastoral care
- Security: 24/7 campus security and shuttle services

8. INTERNET & ICT
- Campus-wide WiFi (SSID: UCC-Campus)
- Computer labs in all faculties
- Free email accounts (@ucc.edu.gh)
- Online learning platform (Moodle/Sakai)
- IT Help Desk: Support for technical issues`,
    keywords: ['library', 'hospital', 'accommodation', 'sports', 'wifi', 'campus', 'facilities', 'services']
  },
  // ─── GENERAL ──────────────────────────────────────────────────────────────
  {
    category: 'general',
    title: 'General Information and Contact Details',
    content: `UCC GENERAL INFORMATION:

UNIVERSITY OVERVIEW:
- Full Name: University of Cape Coast
- Established: 1962
- Location: Cape Coast, Central Region, Ghana
- Type: Public University
- Student Population: 70,000+
- Academic Staff: 1,500+

FACULTIES AND SCHOOLS:
1. Faculty of Arts
2. Faculty of Education
3. Faculty of Social Sciences
4. Faculty of Science
5. School of Business
6. School of Agriculture
7. School of Medical Sciences
8. School of Engineering

CONTACT INFORMATION:

MAIN SWITCHBOARD:
- Phone: +233 (0)33 213 2480
- Email: info@ucc.edu.gh
- Website: www.ucc.edu.gh

ADMISSIONS OFFICE:
- Phone: +233 (0)33 213 2440
- Email: admissions@ucc.edu.gh
- Location: Main Administration Block

REGISTRY:
- Phone: +233 (0)33 213 2450
- Email: registry@ucc.edu.gh
- Hours: Mon-Fri, 8:00 AM - 5:00 PM

FEES & ACCOUNTS:
- Phone: +233 (0)33 213 2460
- Email: accounts@ucc.edu.gh

STUDENT AFFAIRS:
- Phone: +233 (0)33 213 2470
- Email: studentaffairs@ucc.edu.gh

EMERGENCY CONTACTS:
- Campus Security: +233 (0)33 213 2222 (24/7)
- UCC Hospital: +233 (0)33 213 2300 (24/7)
- Fire Service: 192
- Ambulance: 193
- Police: 191

SOCIAL MEDIA:
- Facebook: @UniversityOfCapeCoast
- Twitter: @UCC_Ghana
- Instagram: @ucc_official
- LinkedIn: University of Cape Coast

POSTAL ADDRESS:
University of Cape Coast
PMB, University Post Office
Cape Coast, Ghana

GETTING TO CAMPUS:
- From Accra: 2.5 hours by road (VIP, STC buses)
- From Takoradi: 1 hour by road
- Taxis and trotros available from Cape Coast town
- Uber/Bolt available in Cape Coast

CAMPUS MAP:
- Download from: www.ucc.edu.gh/campus-map
- Physical copies at Security Gates and Information Desk`,
    keywords: ['contact', 'phone', 'email', 'location', 'address', 'emergency', 'general', 'information']
  }
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function createPDFDocument(entry: KnowledgeEntry): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Title
  page.drawText(entry.title.toUpperCase(), {
    x: margin,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0.2, 0.4),
  });
  
  yPosition -= 30;

  // Category badge
  page.drawRectangle({
    x: margin,
    y: yPosition - 15,
    width: 100,
    height: 20,
    color: rgb(0.9, 0.95, 1),
  });
  
  page.drawText(`Category: ${entry.category}`, {
    x: margin + 5,
    y: yPosition - 10,
    size: 9,
    font: font,
    color: rgb(0, 0.2, 0.4),
  });

  yPosition -= 40;

  // Content
  const contentLines = entry.content.split('\n');
  const maxWidth = width - 2 * margin;
  
  for (const line of contentLines) {
    if (yPosition < margin + 50) {
      // Need new page
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - margin;
    }

    const words = line.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, 11);
      
      if (textWidth > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
    
    yPosition -= 5; // Extra space between paragraphs
  }

  // Footer
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const currentPage = pages[i];
    currentPage.drawText('University of Cape Coast - Student Handbook', {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentPage.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - margin - 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return pdfDoc.save();
}

async function uploadToS3(key: string, body: Uint8Array): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upload to S3: s3://${KNOWLEDGE_DOCS_BUCKET}/${key}`);
    return;
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: KNOWLEDGE_DOCS_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/pdf',
    Metadata: {
      'source': 'seed-script',
      'created-at': new Date().toISOString(),
    }
  }));
  
  console.log(`  ✓ Uploaded to S3: ${key}`);
}

async function saveToDynamoDB(entry: KnowledgeEntry): Promise<void> {
  const knowledgeId = randomUUID();
  const now = new Date().toISOString();
  
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would save to DynamoDB: ${knowledgeId} - ${entry.title}`);
    return;
  }

  await dynamoClient.send(new PutCommand({
    TableName: DYNAMODB_TABLE_KNOWLEDGE,
    Item: {
      knowledgeId,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
  }));
  
  console.log(`  ✓ Saved to DynamoDB: ${entry.title}`);
}

async function triggerBedrockIngestion(): Promise<void> {
  if (!BEDROCK_KNOWLEDGE_BASE_ID || !BEDROCK_KNOWLEDGE_DATA_SOURCE_ID) {
    console.log('⚠️  Bedrock KB not configured, skipping ingestion trigger');
    return;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would trigger Bedrock ingestion for KB: ${BEDROCK_KNOWLEDGE_BASE_ID}`);
    return;
  }

  const response = await bedrockClient.send(new StartIngestionJobCommand({
    knowledgeBaseId: BEDROCK_KNOWLEDGE_BASE_ID,
    dataSourceId: BEDROCK_KNOWLEDGE_DATA_SOURCE_ID,
  }));

  console.log(`✓ Bedrock ingestion job started: ${response.ingestionJob?.ingestionJobId}`);
  console.log(`  Status: ${response.ingestionJob?.status}`);
  console.log(`  Documents will be searchable in 2-5 minutes`);
}

// ─── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 UCC Knowledge Base Seeding Script\n');
  console.log('═'.repeat(60));
  
  // Validate configuration
  if (!DRY_RUN) {
    if (!KNOWLEDGE_DOCS_BUCKET && !SKIP_S3) {
      throw new Error('KNOWLEDGE_DOCS_BUCKET environment variable is required');
    }
    if (!DYNAMODB_TABLE_KNOWLEDGE && !SKIP_DYNAMODB) {
      throw new Error('DYNAMODB_TABLE_KNOWLEDGE environment variable is required');
    }
  }

  console.log(`\nConfiguration:`);
  console.log(`  AWS Region: ${AWS_REGION}`);
  console.log(`  S3 Bucket: ${KNOWLEDGE_DOCS_BUCKET || 'N/A'}`);
  console.log(`  DynamoDB Table: ${DYNAMODB_TABLE_KNOWLEDGE || 'N/A'}`);
  console.log(`  Bedrock KB: ${BEDROCK_KNOWLEDGE_BASE_ID || 'Not configured'}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Skip S3: ${SKIP_S3}`);
  console.log(`  Skip DynamoDB: ${SKIP_DYNAMODB}`);
  console.log('');

  let s3Count = 0;
  let dynamoCount = 0;
  const errors: string[] = [];

  // Process each knowledge entry
  for (let i = 0; i < KNOWLEDGE_ENTRIES.length; i++) {
    const entry = KNOWLEDGE_ENTRIES[i];
    console.log(`\n[${i + 1}/${KNOWLEDGE_ENTRIES.length}] Processing: ${entry.title}`);
    
    try {
      // Upload to S3
      if (!SKIP_S3) {
        console.log('  Creating PDF...');
        const pdfBytes = await createPDFDocument(entry);
        
        const fileName = entry.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const s3Key = `${entry.category}/${fileName}.pdf`;
        
        await uploadToS3(s3Key, pdfBytes);
        s3Count++;
      }

      // Save to DynamoDB
      if (!SKIP_DYNAMODB) {
        await saveToDynamoDB(entry);
        dynamoCount++;
      }
    } catch (error) {
      const errMsg = `Failed to process "${entry.title}": ${error}`;
      console.error(`  ❌ ${errMsg}`);
      errors.push(errMsg);
    }
  }

  // Trigger Bedrock ingestion if S3 uploads were performed
  if (!SKIP_S3 && s3Count > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('\n🔄 Triggering Bedrock Knowledge Base ingestion...\n');
    try {
      await triggerBedrockIngestion();
    } catch (error) {
      const errMsg = `Failed to trigger Bedrock ingestion: ${error}`;
      console.error(`❌ ${errMsg}`);
      errors.push(errMsg);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Seeding Summary:\n');
  console.log(`  Documents uploaded to S3: ${s3Count}`);
  console.log(`  Entries saved to DynamoDB: ${dynamoCount}`);
  console.log(`  Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  if (!DRY_RUN && errors.length === 0) {
    console.log('\n✅ Knowledge base seeded successfully!');
    if (!SKIP_S3 && BEDROCK_KNOWLEDGE_BASE_ID) {
      console.log('\n⏳ Wait 2-5 minutes for Bedrock to complete indexing.');
      console.log('   Then test queries via the chat interface.');
    }
  } else if (DRY_RUN) {
    console.log('\n✅ Dry run completed. No changes were made.');
    console.log('   Run without --dry-run to execute.');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
