# บทที่ 3: การวิเคราะห์และออกแบบระบบ (System Analysis and Design)

ในบทนี้จะอธิบายถึงรายละเอียดการออกแบบสถาปัตยกรรมระบบ ขอบเขตของกระบวนการทำงาน และโครงสร้างฐานข้อมูลของระบบ Velin Inventory & E-Commerce ซึ่งอ้างอิงจากขั้นตอนการทำงานเชิงลึก (Deep Technical Flow) และฐานข้อมูลจริง 11 ตาราง โดยมีเป้าหมายเพื่อความเป็นสากลและความปลอดภัยสูงสุด

---

## 1. แผนภาพบริบท (Context Diagram)

แสดงการไหลของข้อมูลที่แยกฝั่งผู้ใช้งานและผู้ดูแลระบบอย่างชัดเจนตามสถาปัตยกรรมจริง

```plantuml
@startuml
' Diagram 
skinparam actorStyle awesome
left to right direction
skinparam DefaultFontName Tahoma

actor "Customer / Guest" as CUS
rectangle "ระบบ Velin Inventory & E-Commerce" as SYS
actor "Admin" as ADM
actor "Super Admin" as SAD
actor "External Services (Maps/Bank)" as EXT

' เส้นเชื่อมโยงข้อมูลฝั่งซ้าย (ลูกค้า)
CUS --> SYS : ข้อมูลสมัครสมาชิก, คำสั่งซื้อ, อัปโหลดสลิปเงิน,\nพิกัด GPS ที่อยู่จัดส่ง, รีวิวสินค้า,\nข้อมูลบัญชีธนาคาร (กรณีขอคืนเงิน)
SYS --> CUS : รายการสินค้า, สถานะจัดส่งแบบ Real-time, เลขพัสดุ,\nแจ้งเตือนผลตรวจสลิป, ยืนยันยอดคืนเงินพร้อมหลักฐาน (Slip)

' เส้นเชื่อมโยงข้อมูลฝั่งขวา (แอดมินและหน่วยงานภายนอก)
SYS --> ADM : แจ้งเตือนออเดอร์ใหม่, รายงานสินค้าใกล้หมดคลัง
ADM --> SYS : จัดการสินค้า/สต็อกรายไซส์ (Shoe/Apparel),\nตรวจสอบสลิปเงิน (Verify), อัปเดตสถานะจัดส่ง,\nเรียกดูรายงานยอดขาย, อัปโหลดสลิปคืนเงิน

SYS --> SAD : รายงาน Audit Logs (JSON Details)
SAD --> SYS : สแกนใบหน้าเข้าสู่ระบบ (FaceID),\nจัดการสิทธิ์แอดมิน, ตรวจสอบประวัติกิจกรรม (Logs)

SYS --> EXT : ขอข้อมูลแผนที่ (OSM) และพิกัดตำแหน่ง
EXT --> SYS : ข้อมูลแผนที่และพิกัดละติจูด/ลองจิจูด
@enduml
```

---

## 2. แผนภาพยูสเคส (Use Case Diagram)

แสดงฟังก์ชันการทำงานที่จัดลำดับตามความสำคัญ โดยมีแอดมินเป็นผู้ควบคุมการแจ้งสถานะจัดส่งและสมาชิกเป็นผู้ใช้งานหลัก

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
left to right direction
skinparam DefaultFontName Tahoma

actor "Guest (ผู้เยี่ยมชม)" as GST
actor "Customer (สมาชิก)" as CUS
actor "Admin (แอดมิน)" as ADM
actor "Super Admin" as SAD

GST <|-- CUS
ADM <|-- SAD

package "Velin System Boundary" {
  ' เรียงลำดับตามความสำคัญและตำแหน่งที่ต้องการ
  usecase "ยืนยันรับสินค้าและรีวิวสินค้า" as UC7
  usecase "สมัครสมาชิก / ลงชื่อเข้าใช้งาน" as UC1
  usecase "เลือกชมสินค้าและกรองแบรนด์" as UC2
  usecase "อัปเดตสถานะและแจ้งเตือนจัดส่ง" as UC15
  usecase "สลับภาษาการใช้งาน (TH/EN)" as UC21
  usecase "พิมพ์ใบเสร็จ PDF และเลข Tracking" as UC24
  usecase "ยกเลิกออเดอร์และคืนสต็อกอัตโนมัติ" as UC16
  
  ' ฟังก์ชันเสริมและระบบจัดการ
  usecase "จัดการโปรไฟล์และพิกัดที่อยู่ (Map)" as UC23
  usecase "จัดการรายการโปรด (Wishlist)" as UC3
  usecase "จัดการตะกร้าสินค้า (Member Only)" as UC4
  usecase "ชำระเงินและตรวจสอบค่าจัดส่งอัตโนมัติ" as UC5
  usecase "อัปโหลดสลิปและติดตามสถานะ" as UC6
  usecase "แจ้งข้อมูลคืนเงิน (Refund)" as UC10
  usecase "จัดการสินค้าและสต็อกรายไซส์" as UC11
  usecase "ค้นหาด้วยคำสั่งลับ (Prefix Search)" as UC13
  usecase "ตรวจสอบสลิปและยืนยันยอดเงิน" as UC14
  usecase "รายงานยอดขายและวิเคราะห์กราฟ" as UC17
  usecase "สแกนใบหน้า (AI FaceID)" as UC18
  usecase "บริหารจัดการแอดมินและสิทธิ์" as UC19
  usecase "ตรวจสอบประวัติ Audit Logs (JSON)" as UC20
  usecase "อัปโหลดหลักฐานการโอนเงินคืน" as UC25
}

' โยงเส้น GST
GST --> UC1
GST --> UC2
GST --> UC21

' โยงเส้น CUS
CUS --> UC7
CUS --> UC23
CUS --> UC3
CUS --> UC4
CUS --> UC5
CUS --> UC6
CUS --> UC10

' โยงเส้น ADM
ADM --> UC15
ADM --> UC24
ADM --> UC11
ADM --> UC13
ADM --> UC14
ADM --> UC16
ADM --> UC17
ADM --> UC21
ADM --> UC25

' โยงเส้น SAD
SAD --> UC18
SAD --> UC19
SAD --> UC20
@enduml
```

---

## 3. แผนภาพขั้นตอนการทำงาน (System Workflows)

### 3.1 Workflow: ลำดับขั้นตอนการสั่งซื้อหลัก (Swimlane)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam conditionStyle insideDiamond
skinparam DefaultFontName Tahoma

|Customer (ลูกค้า)|
start
:เลือกสินค้า/ไซส์\nและปักหมุดที่อยู่ (Maps);
:อัปโหลดสลิปและยืนยันค่าส่งตามพื้นที่;

|System (ระบบกลาง)|
:Snapshot ที่อยู่ปัจจุบันลงในใบสั่งซื้อ;\n:หักสต็อกสินค้าแยกตามไซส์จริง;

|Admin (ผู้ดูแลระบบ)|
if (ตรวจสอบสลิปและยอดเงินถูกต้อง?) then (ใช่)
  :กดยืนยันยอดเงิน (Verify);
  |System (ระบบกลาง)|
  :อัปเดตสถานะเป็น 'ชำระแล้ว';
  |Admin (ผู้ดูแลระบบ)|
  :กรอกเลขพัสดุและอัปเดตสถานะเป็น 'Shipped';
  :อัปเดตสถานะเมื่อพัสดุถึง 'Arrived';
  |Customer (ลูกค้า)|
  :แสดงใบสรุปสั่งซื้อพร้อมแผนที่ที่อยู่;\n:กดยืนยันการรับสินค้า (Delivered);
  :เขียนรีวิวและให้คะแนนดาว;
  stop
else (ยอดเงินไม่ถูกต้อง / สลิปผิด)
  |Admin (ผู้ดูแลระบบ)|
  :กดยกเลิกออเดอร์ (Cancel) พร้อมระบุเหตุผล;
  |System (ระบบกลาง)|
  :คืนสต็อกสินค้าเข้าคลังอัตโนมัติ;\n:แจ้งเตือนลูกค้า (ระบุเหตุผล);
  |Customer (ลูกค้า)|
  if (ต้องการขอเงินคืน?) then (ใช่)
    :กรอกบัญชีธนาคารผ่านฟอร์มคืนเงิน;
    |Admin (ผู้ดูแลระบบ)|
    :โอนเงินคืนและอัปโหลดหลักฐานการโอนคืน;
    :อัปเดตสถานะเป็น 'Refunded';
  else (ไม่ขอคืนเงิน)
    :สิ้นสุดรายการ (โดนปล่อย);
  endif
  stop
endif
@enduml
```

### 3.2 Workflow: การจัดการสิทธิ์และเข้าสู่ระบบด้วย AI FaceID (SuperAdmin Control)

แผนภาพแสดงขั้นตอนการลงทะเบียนข้อมูลใบหน้าโดย SuperAdmin และการเข้าใช้งานของแอดมินที่มีสิทธิ์ระดับสูงสุด

#### **3.2.1 ขั้นตอนการลงทะเบียนและแก้ไขใบหน้า (Enrolling & Editing)**
```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam conditionStyle insideDiamond
skinparam DefaultFontName Tahoma

|SuperAdmin (Manager)|
start
:เข้าสู่ระบบหลังบ้าน (Dashboard);
:เลือกเมนู "จัดการสมาชิกแอดมิน";
if (ต้องการแก้ไขข้อมูลเดิม?) then (ใช่)
  :เลือกบัญชีแอดมินที่ต้องการแก้ไข;
else (ไม่ใช่)
  :กดปุ่ม "เพิ่มแอดมินใหม่";
  :กรอกข้อมูลพื้นฐาน (Username, Password, Name);
  :ปรับสถานะ Role ให้เป็น "SuperAdmin";
endif

repeat
  :กดปุ่ม "เริ่มสแกนใบหน้า (Scan Face)";

  |System (AI App)|
  :เปิดกล้องและตรวจจับใบหน้า (Detection);
  :สกัดค่าคุณลักษณะใบหน้า (Feature Extraction);
  :แปลงเป็น Face Vector (Descriptor);

  |SuperAdmin (Manager)|
  :ตรวจสอบความชัดเจนบนหน้าจอ;
backward:สแกนใหม่ (Rescan);
repeat while (ต้องการแก้ไขใบหน้าใหม่?) is (ใช่) not (ไม่ใช่)

:กดปุ่ม "บันทึกข้อมูล (Save Changes)";

|Database|
:บันทึก/อัปเดตค่า face_descriptor\nลงในตาราง USERS;

|SuperAdmin (Manager)|
:แสดงสถานะ "บันทึกข้อมูลและใบหน้าสำเร็จ";
stop
@enduml
```

#### **3.2.2 ขั้นตอนการเข้าสู่ระบบด้วยใบหน้า (FaceID Login Flow)**
```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam conditionStyle insideDiamond
skinparam DefaultFontName Tahoma

|Admin / SuperAdmin|
start
:ไปที่หน้าเว็บไซต์ (ฝั่ง Admin Login);
:เลือกวิธีเข้าใช้งานด้วย "FaceID";

|System (AI App)|
:เปิดกล้องเพื่อสแกนใบหน้า;
:คำนวณค่า Euclidean Distance\nเทียบกับฐานข้อมูลทั้งหมด;

|Database|
:ดึงข้อมูล Vector ของกลุ่ม Admin/SuperAdmin;

|System (AI App)|
if (พบข้อมูลที่ตรงกัน > 90%?) then (ใช่)
  :ตรวจสอบสิทธิ์ล่าสุดในฐานข้อมูล;
  if (Role ยังคงเป็น SuperAdmin?) then (ใช่)
    :สร้าง JWT Access Token;
    :นำเข้าสู่หน้าจัดการระบบ (Dashboard);
    stop
  else (ไม่ใช่)
    :แจ้งเตือน "สิทธิ์การเข้าถึงถูกจำกัด";
    stop
  endif
else (ไม่พบข้อมูล)
  :แจ้งเตือน "ไม่พบข้อมูลใบหน้าในระบบ";
  :แนะนำให้เข้าด้วยรหัสผ่านปกติ;
  stop
endif
@enduml
```

### 3.3 Workflow: การจัดการสินค้าและสต็อก (Admin Management)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma

|Admin|
start
:เข้าสู่ระบบผู้ดูแลระบบ (Admin Dashboard);
:เลือกเมนู "จัดการสินค้า" > "เพิ่มสินค้าใหม่";
:กรอกข้อมูลพื้นฐาน (ชื่อสินค้า, แบรนด์, รายละเอียด);
:เลือกหมวดหมู่สินค้า (Category);

if (ประเภทสินค้า?) then (รองเท้า / Shoe)
  :กำหนดไซส์รองเท้า (EU/US/CM);
  :ระบุจำนวนสต็อกในแต่ละไซส์;
else (เสื้อผ้า / Apparel)
  :กำหนดไซส์เสื้อผ้า (S/M/L/XL);
  :ระบุจำนวนสต็อกในแต่ละไซส์;
endif

:อัปโหลดรูปภาพสินค้า (Multiple Images);

|Backend API|
:ประมวลผลรูปภาพและบันทึกไฟล์;
:ตรวจสอบความถูกต้องของข้อมูลสต็อก;

|Database|
:บันทึกข้อมูลสินค้าหลัก (PRODUCTS);
if (ประเภทสินค้า?) then (รองเท้า)
  :บันทึกสต็อกลงตาราง SHOE_SIZES;
else (เสื้อผ้า)
  :บันทึกสต็อกลงตาราง APPAREL_SIZES;
endif
:เชื่อมโยงรูปภาพ (PRODUCT_IMAGES);

|Backend API|
:แจ้งเตือนสถานะ "เพิ่มสินค้าสำเร็จ";

|System (App / Mobile)|
:อัปเดตข้อมูลบนหน้าแอปพลิเคชันทันที;
stop
@enduml
```

### 3.4 Workflow: การขอคืนเงิน (Refund Process)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma

|Customer|
start
:เลือกคำสั่งซื้อที่ถูกยกเลิก;
:กรอกแบบฟอร์มขอคืนเงิน\n(ระบุเลขบัญชีธนาคาร);

|Admin|
:รับรายการขอคืนเงินในระบบ;
:ตรวจสอบสลิปการโอนเดิม;
:ดำเนินการโอนเงินคืน (ภายนอก);
:อัปโหลดหลักฐานการโอนคืน;

|System (Notification)|
:เปลี่ยนสถานะคำสั่งซื้อเป็น "Refunded";
:ส่งข้อความแจ้งเตือนลูกค้า;

|Customer|
:ตรวจสอบยอดเงินคืนในหน้าประวัติ;
stop
@enduml
```

### 3.5 Workflow: การสมัครสมาชิกและจัดการพิกัดที่อยู่ (Customer Registration)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma

|Customer|
start
:เข้าสู่หน้า "สมัครสมาชิก";
:กรอกอีเมล (Email) และรหัสผ่าน (Password);

|Backend API|
:เข้ารหัสรหัสผ่านด้วย Bcrypt (Hash);
:บันทึกบัญชีลงฐานข้อมูล (USERS - Basic Info);

|Customer|
:ระบบแจ้งเตือน "สร้างบัญชีสำเร็จ";
:เข้าสู่ระบบ (Login) ด้วยบัญชีที่เพิ่งสร้าง;

|System (App)|
:ตรวจสอบสิทธิ์และออก JWT Token;

|Customer|
:เข้าสู่หน้า "จัดการโปรไฟล์ (Profile)";
:กรอกข้อมูลเพิ่มเติม (ชื่อ-สกุล, เบอร์โทรศัพท์);
:เปิดแผนที่เพื่อ "ปักหมุดที่อยู่จัดส่ง" (GPS Pinning);

|Customer|
:กดปุ่ม "บันทึกข้อมูลโปรไฟล์ (Save Changes)";

|System (App)|
:ดึงค่า Latitude / Longitude และรวบรวมข้อมูลทั้งหมด;

|Database|
:อัปเดตข้อมูลที่อยู่และโปรไฟล์ลงตาราง USERS;

|Customer|
:แสดงสถานะ "ข้อมูลโปรไฟล์สมบูรณ์";
:พร้อมสำหรับการสั่งซื้อสินค้า;
stop
@enduml
```

### 3.6 Workflow: การเลือกซื้อสินค้าและชำระเงิน (Shopping & Checkout)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam conditionStyle insideDiamond
skinparam DefaultFontName Tahoma

|Customer|
start
:เลือกชมสินค้าที่ต้องการ;
:เลือกไซส์ (Size) และจำนวน;

|System (App)|
:ตรวจสอบสต็อกแบบ Real-time;
if (มีสินค้าพร้อมส่ง?) then (ใช่)
  :เพิ่มสินค้าลงใน "ตะกร้า (Cart)";
else (ไม่พอ)
  :แจ้งเตือน "สินค้าไซส์นี้หมด";
  detach
endif

|Customer|
:ไปที่หน้า Checkout;
:ยืนยันที่อยู่จัดส่ง (จากพิกัดที่ปักหมุดไว้);

|System (App)|
:ตรวจสอบพื้นที่จัดส่ง (Latitude / Longitude);
if (พื้นที่จัดส่ง?) then (อยู่ในกรุงเทพฯ)
  :เลือกขนส่งอัตโนมัติ: **Messenger**;
else (ต่างจังหวัด)
  :เลือกขนส่งอัตโนมัติ: **EMS**;
endif
:คำนวณค่าจัดส่งตามระยะทางและประเภทขนส่ง;
:รวมยอดคำสั่งซื้อทั้งหมด;

|Customer|
:ตรวจสอบยอดและกด "ยืนยันการสั่งซื้อ";

|Database|
:สร้างออเดอร์ใหม่ (ORDERS);
:บันทึกประเภทขนส่งที่ระบบเลือกให้;
:ทำ **Snapshot** ที่อยู่และราคา ณ เวลานั้น;
:ตัดสต็อกสินค้าชั่วคราว;

|Customer|
:อัปโหลดสลิปหลักฐานการโอนเงิน;
:รอแอดมินตรวจสอบสถานะ;
stop
@enduml
```

---

## 4. แผนภาพกระแสข้อมูลระดับ 0 (Data Flow Diagram - DFD Level 0)

แสดงการเชื่อมโยงข้อมูลระหว่างกระบวนการหลักและคลังข้อมูล (Data Stores)

```plantuml
@startuml
' Diagram 
skinparam backgroundColor white
skinparam DefaultFontName Tahoma

actor "Customer" as CUS
actor "Admin" as ADM
actor "Super Admin" as SAD

usecase "1.0\nจัดการสมาชิก\nและข้อมูลพิกัดที่อยู่" as P1
usecase "2.0\nจัดการสต็อก\nและข้อมูลสินค้า" as P2
usecase "3.0\nจัดการธุรกรรม\nการเงิน และขนส่ง" as P3
usecase "4.0\nสรุปรายงาน\nและตรวจสอบประวัติ" as P4

database "D1: Users & Profiles" as D1
database "D2: Products & Images" as D2
database "D3: Stock & Sizes" as D3
database "D4: Orders & Snapshot" as D4
database "D5: Cart & Wishlist" as D5
database "D6: Product Comments" as D6
database "D7: Admin Logs" as D7

CUS --> P1 : ข้อมูลสมาชิก/พิกัดที่อยู่
P1 --> D1 : จัดการโปรไฟล์

ADM --> P2 : จัดการสินค้าและรูปภาพ
P2 --> D2 : บันทึกข้อมูลสินค้า
ADM --> P2 : ปรับสต็อกแยกตามประเภทไซส์
P2 --> D3 : ปรับปรุงยอดสต็อกคลัง
CUS --> P2 : ข้อมูลรีวิวและ Rating
P2 --> D6 : บันทึกความคิดเห็น

CUS --> P3 : สั่งซื้อสินค้าและส่งสลิป
P3 --> D4 : บันทึกออเดอร์และที่อยู่ Snapshot
P3 --> D3 : ตัด/คืนสต็อกตามออเดอร์
P3 --> D5 : เคลียร์ตะกร้าสินค้าสมาชิก
ADM --> P3 : ตรวจสลิป, ใส่เลขพัสดุ และแนบหลักฐานคืนเงิน
D4 --> P3 : ข้อมูลจัดส่ง/แจ้งคืนเงิน
P3 --> CUS : แจ้งเตือนสถานะเงิน, ขนส่ง และหลักฐานคืนเงิน

D4 --> P4 : ข้อมูลรายได้และยอดขาย
P4 --> ADM : รายงาน Dashboard และ PDF
ADM --> P4 : บันทึกกิจกรรม Admin
P4 --> D7 : บันทึก JSON Diff (Audit)
D7 --> P4 : ดึงข้อมูลเพื่อวิเคราะห์
P4 --> SAD : รายงาน Audit Logs ระบบ
@enduml
```

---

## 5. แผนภาพกระแสข้อมูลระดับ 1 (DFD Level 1)

### 5.1 ระบบการเงินและการขนส่ง

```plantuml
@startuml
' Diagram 
skinparam DefaultFontName Tahoma

actor "Customer" as CUS
usecase "3.1\nคำนวณราคาสุทธิและตรวจสอบค่าส่ง" as P31
usecase "3.2\nตรวจสอบสลิปและยืนยันยอดเงิน" as P32
usecase "3.3\nออกเลขพัสดุและติดตามสถานะ" as P33
usecase "3.4\nจัดการยกเลิกและระบบคืนเงิน" as P34
actor "Admin" as ADM

database "D3: Stock & Sizes" as D3
database "D4: Orders & Snapshot" as D4

CUS --> P31 : ยืนยันพิกัดจัดส่ง
P31 --> D4 : บันทึกออเดอร์
P31 --> D3 : ตัดสต็อกไซส์

CUS --> P32 : อัปโหลดสลิป
ADM --> P32 : ตรวจสอบยอด
P32 --> D4 : อัปเดตสถานะ

D4 --> P33 : ข้อมูลส่งของ
ADM --> P33 : บันทึกเลขพัสดุ
P33 --> D4 : อัปเดตสถานะ

CUS --> P34 : ส่งเลขบัญชีคืนเงิน
ADM --> P34 : โอนเงินและอัปโหลดหลักฐานคืนเงิน
P34 --> D4 : บันทึกหลักฐาน/ปรับสถานะ/คืนสต็อก
@enduml
```

### 5.2 แผนภาพกระแสข้อมูลระดับ 1 (DFD Level 1) - ระบบจัดการข้อมูลสินค้า

```plantuml
@startuml
' Diagram 
skinparam DefaultFontName Tahoma

actor "Admin" as ADM
usecase "2.1\nเพิ่มและแก้ไขข้อมูลสินค้า" as P21
usecase "2.2\nปรับปรุงสต็อกรายไซส์" as P22
usecase "2.3\nลบข้อมูลสินค้าออกจากคลัง" as P23
usecase "2.4\nจัดการแบรนด์และรีวิว" as P24
actor "Customer" as CUS

database "D2: Products & Images" as D2
database "D3: Stock & Sizes" as D3
database "D6: Product Comments" as D6

ADM --> P21 : บันทึกข้อมูลสินค้า
P21 --> D2 : บันทึกข้อมูล

ADM --> P22 : ปรับปรุงยอดสต็อก
P22 --> D3 : อัปเดตสต็อกคงเหลือ

ADM --> P23 : ลบสินค้าออกจากระบบ
P23 --> D2 : เปลี่ยนสถานะสินค้า

CUS --> P24 : ส่งรีวิวและ Rating
P24 --> D6 : บันทึกรีวิว
ADM --> P24 : ตรวจสอบ/ลบรีวิว
@enduml
```

---

## 6. แผนภาพลำดับขั้นตอน (Sequence Diagrams)

แสดงการปฏิสัมพันธ์ระหว่าง Frontend, Backend และ Database แบบ Real-time

### 6.1 ขั้นตอนการตรวจสอบสลิปเงินอัตโนมัติ

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma
skinparam sequenceGroupFontSize 15
skinparam sequenceGroupHeaderFontSize 13
autonumber

actor "Customer" as CUS
participant "Mobile App\n(Frontend)" as APP
participant "Express API\n(Backend)" as API
participant "Image Engine\n(Multer)" as IMG
database "MySQL\n(Database)" as DB
actor "Admin" as ADM

CUS -> APP : อัปโหลดสลิปการโอนเงิน
APP -> API : POST /api/upload-slip (image file)
API -> IMG : บันทึกไฟล์ลงโฟลเดอร์ /uploads/slips
IMG --> API : คืนค่า Path ของไฟล์
API -> DB : บันทึกข้อมูลการชำระเงิน (สถานะ: รอตรวจสอบ)
DB --> API : สำเร็จ (Success)
API --> APP : แสดงสถานะ "รอการตรวจสอบ"
note right of APP: ฝั่ง User รอผลการตรวจสอบ

  == ขั้นตอนการตรวจสอบโดย Admin ==

ADM -> API : เรียกดูรายการแจ้งชำระเงิน (รายรายการ)
API -> DB : SELECT * FROM orders WHERE status='pending'
DB --> API : ข้อมูลคำสั่งซื้อและลิงก์รูปสลิป
API --> ADM : แสดงหน้าข้อมูลรายการนั้นๆ (ไม่ใช่หน้า Dashboard รวม)

ADM -> ADM : ตรวจสอบยอดเงินจริงใน App ธนาคาร

alt ตรวจสอบผ่าน
    ADM -> API : ยืนยันยอดเงิน (Verify Order)
    API -> DB : UPDATE orders SET status='shipped', slip_verified=1
    DB --> API : สำเร็จ (Success)
    API --> ADM : อัปเดตหน้าจอสำเร็จ
    API -> CUS : แจ้งเตือน: ตรวจสอบสลิปผ่านแล้ว
else ตรวจสอบไม่ผ่าน
    ADM -> API : แจ้งผลไม่ผ่าน (ระบุเหตุผล: เงินผิด/ไม่พอ)
    API -> DB : UPDATE orders SET status='cancelled'
    DB --> API : สำเร็จ (Success)
    API --> ADM : แจ้งเตือนส่งถึง User สำเร็จ
    API -> CUS : แจ้งเตือน: ไม่ผ่านเนื่องจาก [ระบุเหตุผล]
    
    alt ลูกค้าขอคืนเงิน
        CUS -> APP : ส่งข้อมูลบัญชีธนาคารเพื่อขอคืนเงิน
        APP -> API : ส่งคำขอคืนเงิน (ระบุเลขบัญชี)
        API -> DB : บันทึกข้อมูลเลขบัญชีลงใน Order
        DB --> API : สำเร็จ
        
        ADM -> API : ตรวจสอบข้อมูลบัญชีลูกค้า
        API --> ADM : แสดงข้อมูลเลขบัญชีธนาคาร
        ADM -> ADM : ดำเนินการโอนเงินคืน (ภายนอกระบบ)
        ADM -> API : ยืนยันการโอนเงินคืน (อัปโหลดหลักฐานการโอน)
        API -> IMG : บันทึกไฟล์หลักฐานคืนเงิน (/uploads/refunds)
        IMG --> API : คืนค่า Path ของไฟล์
        API -> DB : UPDATE orders SET status='refunded', refund_slip_url='...'
        DB --> API : สำเร็จ
        API -> CUS : แจ้งเตือน: คืนเงินสำเร็จพร้อมหลักฐาน
    else ไม่ขอคืนเงิน (ปล่อยรายการ)
        CUS -> CUS : ยอมรับผลและจบรายการ (โดนปล่อย)
    end
end
@enduml
```

### 6.2 ขั้นตอนการทำงานของ AI FaceID (Enrollment & Auth Sequence)

แสดงลำดับการรับส่งข้อมูลระหว่างการลงทะเบียนโดย SuperAdmin และการตรวจสอบสิทธิ์

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma
autonumber

actor "SuperAdmin" as SAD
participant "Admin UI\n(Management Page)" as UI
participant "FaceAPI.js\n(AI Library)" as AI
participant "Auth API\n(Backend)" as API
database "MySQL" as DB

== ขั้นตอนการลงทะเบียน / แก้ไขใบหน้า ==

SAD -> UI : เลือกแอดมินและปรับ Role เป็น 'superadmin'
UI -> SAD : แสดงปุ่ม "Scan Face"
SAD -> UI : กดปุ่มสแกน
UI -> AI : เรียกใช้กล้องและตรวจจับใบหน้า
AI --> SAD : แสดงกรอบใบหน้าแบบ Real-time
AI -> AI : สกัดค่า Landmark และสร้าง Descriptor Vector
AI --> UI : ส่งค่า Vector (Float32Array)
SAD -> UI : กด "Save" (กรอกข้อมูลครบถ้วน)
UI -> API : PUT /api/admin/update-face (user_id, descriptor)
API -> DB : UPDATE users SET face_descriptor = ?, role = 'superadmin'
DB --> API : Success
API --> UI : แจ้งเตือน "บันทึกข้อมูลแอดมินสำเร็จ"
UI --> SAD : แสดงสถานะการลงทะเบียนเสร็จสิ้น

== ขั้นตอนการเข้าสู่ระบบ (Authentication) ==

actor "Admin / SAD" as ADM
ADM -> UI : เข้าหน้า Login และเลือก "FaceID"
UI -> AI : สแกนใบหน้าปัจจุบัน
AI -> AI : สร้าง Descriptor Vector
AI -> API : POST /api/admin/face-login (current_vector)
API -> DB : SELECT username, role, face_descriptor FROM users
DB --> API : รายชื่อแอดมินและรหัสใบหน้า
API -> API : คำนวณความเหมือน (Euclidean Distance)
API -> API : ตรวจสอบสิทธิ์ (Role Check)

alt ตรวจสอบผ่าน
    API --> ADM : ส่ง JWT Token และ Redirect ไป Dashboard
else ตรวจสอบไม่ผ่าน
    API --> ADM : แจ้งเตือน "ยืนยันตัวตนล้มเหลว"
end
@enduml
```

---

## 7. แผนภาพความสัมพันธ์ของเอนทิตี (Entity Relationship Diagram - ERD)

โครงสร้างฐานข้อมูล 11 ตารางที่ออกแบบมาเพื่อความปลอดภัย (Normalization 3NF) และรองรับประวัติข้อมูล (Data Snapshots)

```plantuml
@startuml
' Diagram by worapol สุดหล่อ
skinparam DefaultFontName Tahoma
skinparam linetype ortho
skinparam nodesep 120
skinparam ranksep 150

entity "USERS" {
  * id : int <<PK>>
  --
  username : varchar (Unique)
  password : varchar (Bcrypt)
  role : enum (user/admin/superadmin)
  email : varchar
  full_name : varchar
  phone : varchar
  address : text
  latitude : decimal
  longitude : decimal
  face_descriptor : text (AI Vector)
  created_at : timestamp
}

entity "PRODUCTS" {
  * id : int <<PK>>
  --
  product_code : varchar (SKU)
  category : varchar
  brand : varchar
  name : varchar
  description : text
  price : decimal
  discount_percent : int
  discount_price : decimal (Computed)
  stock : int (Total Stock Sum)
  product_type : varchar (shoe/apparel)
  created_at : timestamp
}

entity "PRODUCT_IMAGES" {
  * id : int <<PK>>
  --
  product_id : int <<FK>>
  image_url : varchar
  display_order : int
}

entity "SHOE_SIZES" {
  * id : int <<PK>>
  --
  product_id : int <<FK>>
  size : varchar (e.g., 42, 43)
  length_cm : varchar
  stock : int
}

entity "APPAREL_SIZES" {
  * id : int <<PK>>
  --
  product_id : int <<FK>>
  size : varchar (e.g., M, L, XL)
  chest_inch : varchar
  stock : int
}

entity "ORDERS" {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  total_amount : decimal
  status : enum (pending/shipped/arrived/delivered/cancelled/refunded)
  slip_url : varchar
  slip_verified : tinyint(1)
  refund_slip_url : varchar
  is_read_admin : tinyint(1)
  shipping_fee : decimal
  shipping_full_name : varchar (Address Snapshot)
  shipping_phone : varchar (Address Snapshot)
  shipping_address : text (Address Snapshot)
  shipping_latitude : decimal
  shipping_longitude : decimal
  bank_name : varchar (Refund Info)
  bank_account_number : varchar
  created_at : timestamp
}

entity "ORDER_ITEMS" {
  * id : int <<PK>>
  --
  order_id : int <<FK>>
  product_id : int <<FK>>
  size : varchar
  quantity : int
  price_at_purchase : decimal (Price Snapshot)
}

entity "CART_ITEMS" {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  product_id : int <<FK>>
  quantity : int
  size : varchar
}

entity "WISHLIST_ITEMS" {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  product_id : int <<FK>>
}

entity "PRODUCT_COMMENTS" {
  * id : int <<PK>>
  --
  product_id : int <<FK>>
  user_id : int <<FK>>
  order_id : int <<FK>>
  rating : int
  comment : text
  created_at : timestamp
}

entity "ADMIN_LOGS" {
  * id : int <<PK>>
  --
  admin_id : int <<FK>>
  action : varchar (Update/Delete/Verify)
  details : text (JSON Diff)
  created_at : timestamp
}

' Relationships (Crow's Foot Notation)
USERS ||--o{ ORDERS : "places"
USERS ||--o{ CART_ITEMS : "adds to"
USERS ||--o{ WISHLIST_ITEMS : "saves"
USERS ||--o{ PRODUCT_COMMENTS : "writes"
USERS ||--o{ ADMIN_LOGS : "performs"

PRODUCTS ||--o{ PRODUCT_IMAGES : "has many"
PRODUCTS ||--o{ SHOE_SIZES : "has many"
PRODUCTS ||--o{ APPAREL_SIZES : "has many"
PRODUCTS ||--o{ ORDER_ITEMS : "included in"
PRODUCTS ||--o{ CART_ITEMS : "in cart"
PRODUCTS ||--o{ WISHLIST_ITEMS : "in wishlist"
PRODUCTS ||--o{ PRODUCT_COMMENTS : "receives"

ORDERS ||--|{ ORDER_ITEMS : "contains"
ORDERS ||--o{ PRODUCT_COMMENTS : "can have"
@enduml
```

---

## 8. พจนานุกรมข้อมูล (Data Dictionary)

รายละเอียดโครงสร้างข้อมูลเชิงลึก (Deep Technical Specification) เพื่อความแม่นยำในการพัฒนาระบบ

### 8.1 กลุ่มข้อมูลผู้ใช้งาน (User & Security)
| Field | Type | Constraint | Description |
|---|---|---|---|
| id | int | PK, AI | รหัสประจำตัวผู้ใช้ (Unique Identifier) |
| face_descriptor | text | Nullable | ข้อมูล Face Vector สำหรับ AI FaceID Login |
| role | enum | Default: 'user' | สิทธิ์การใช้งาน (user, admin, superadmin) |

### 8.2 กลุ่มข้อมูลสินค้าและสต็อก (Product & Inventory)
| Field | Type | Constraint | Description |
|---|---|---|---|
| product_type | varchar | Not Null | ตัวแยกประเภทสินค้า ('shoe' หรือ 'apparel') |
| discount_price | decimal | Computed | ราคาที่คำนวณส่วนลดแล้ว เพื่อความเร็วในการดึงข้อมูล |
| size (sizes table)| varchar | FK | ขนาดสินค้าที่เชื่อมโยงกับตารางไซส์ที่ถูกต้อง |

### 8.3 กลุ่มข้อมูลธุรกรรม (Transaction & Snapshots)
| Field | Type | Constraint | Description |
|---|---|---|---|
| shipping_address | text | **Snapshot** | เก็บที่อยู่ ณ เวลาที่สั่งซื้อจริง (ไม่เปลี่ยนตามโปรไฟล์) |
| price_at_purchase| decimal | **Snapshot** | เก็บราคา ณ เวลาที่ซื้อ เพื่อป้องกันปัญหาเมื่อราคาสินค้าเปลี่ยน |
| refund_slip_url | varchar | Nullable | เก็บ Path ของหลักฐานสลิปการโอนเงินคืนให้ลูกค้า |
| is_read_admin | tinyint | Default: 0 | ระบบแจ้งเตือนแอดมินเมื่อมีออเดอร์ใหม่ |

### 8.4 กลุ่มข้อมูลตรวจสอบ (Audit Logs)
| Field | Type | Constraint | Description |
|---|---|---|---|
| details | text | JSON | เก็บความเปลี่ยนแปลงของข้อมูลในรูปแบบ JSON Diff |

> [!IMPORTANT]
> ระบบฐานข้อมูลถูกออกแบบมาให้รองรับ **Data Integrity** สูงสุด โดยใช้ Snapshot Logic เพื่อให้ประวัติการสั่งซื้อ (History) ไม่ได้รับผลกระทบจากการเปลี่ยนแปลงข้อมูลพื้นฐานในอนาคต
