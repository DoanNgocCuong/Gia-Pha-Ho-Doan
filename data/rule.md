1. I realized matching by line order in Markdown simplifies updating node names to uppercase, avoiding complex AI matching. Will build JSON directly from Markdown lines.

   ko cần phải extract gì, key "name" là cứ lấy y nguyên cái dòng

Ví dụ:

Cụ Ông Đoàn Đức Liễu hiệu Viết Hùng Lực NM 20/10 - Cụ Bà Nguyễn Thị Hàng hiệu Từ Cần) NM 4/7 phần mộ cụ ông được táng tại cánh đồng xóm Đông, Mộ cụ bà được táng tại cánh đồng Rót Làn Man xóm chùa đều ở làng Khê kiều

(viết in hoa hết lên)

Ví du:

Ông Đoàn Văn Đạm NS 1926 NM 17/4/2021 – Bà Trần Thị Bé NS 1928 NM 12/9/2025

(viết in hoa hết lên)

Ví dụ :

Ông Đoàn Văn Ruy CB1 NM 11/1– Bà Nguyễn Thị Lanh NM (viết in hoa hết lên)


---

Prompt 



# SAI LẦM DÙNG MANUS - NGÀY 2026-06-18 - TỐN ĐẾN 6000 CREDIT MÀ KO ĐỒNG BỘ ĐƯỢC FILE DOCS VÀO JSON - VÌ PROMPT LÔM CÔM (NGẮN NHƯ GPTS) MÀ KO CHUẨN BỊ FULL PROMPT INPUT OUTPUT THEO CẤU TRÚC => DẪN ĐẾN NGỐN TOKEN MÀ MÉO RA ĐƯỢC OUTPUT

Sau viết như này cái tốn 100 credit xong luôn

```
## QUY TẮC BUILD JSON GIA PHẢ TỪ FILE MARKDOWN

### Nguyên tắc duy nhất
**1 dòng trong markdown = 1 node trong JSON**

Field `"name"` = nội dung dòng đó, chuyển toàn bộ thành **CHỮ HOA**.

### Cấu trúc mỗi node — chỉ 4 field
{
  "name": "<dòng markdown viết hoa>",
  "gender": "<male | female | ancestor>",
  "depth": <số thứ tự cấp>,
  "children": []
}

Không cần thêm bất kỳ field nào khác:
- ❌ ho
- ❌ ten_dem  
- ❌ ten
- ❌ wifeName  ← đã nằm trong "name" rồi nếu là nam có vợ

### Xác định cha-con
Dựa vào thụt lề hoặc cấp heading trong markdown:
- Thụt vào = con của dòng trên
- depth tăng 1 mỗi cấp

### Ví dụ
Dòng gốc:
  Ông Đoàn Văn Đạm NS 1926 NM 17/4/2021 – Bà Trần Thị Bé NS 1928 NM 12/9/2025

→ Node JSON:
  {
    "name": "ÔNG ĐOÀN VĂN ĐẠM NS 1926 NM 17/4/2021 – BÀ TRẦN THỊ BÉ NS 1928 NM 12/9/2025",
    "gender": "male",
    "depth": 6,
    "children": []
  }

```


---



### QUY TẮC XÁC ĐỊNH `depth`

`depth` = số thứ tự đời, **bắt đầu từ 0** ở node gốc.

**Quy tắc:**

- Node gốc (tổ tiên cao nhất trong file) = depth 0
- depth con = depth cha + 1
- Hai node cùng cấp thụt lề trong markdown = cùng depth

**Ví dụ thực tế từ file:**
depth 0 → CỤ Ô LIỄU - V.CỤ BÀ ĐOÀN THỊ HÀNG ...
  depth 1 → CỤ RŨNG - CỤ BÀ ĐOÀN THỊ HÀNG ...
    depth 2 → I. CỤ HÁN - B1 PHẠM THỊ ĐỨC ...
      depth 3 → BÀ ĐOÀN THỊ TỌA CB1 ...
        depth 4 → ÔNG NGUYỄN VĂN VĨNH ...

**Lưu ý:**

- depth KHÔNG phải số thứ tự dòng
- depth KHÔNG thay đổi dù node là nam, nữ, hay tổ tiên
- Node cha luôn có depth nhỏ hơn node con đúng 1 bậc

---

**GHI CHÚ KINH NGHIỆM:**
ĐÃ THỬ NHIỀU LOẠI ĐỊNH DẠNG ĐỂ ĐƯA VÀO MANUS NHƯNG VÌ DUNG LƯỢNG LỚN QUÁ NÊN BỊ THẤT BẠI NHIỀU LẦN. 

SAU ĐÓ QUAY VỀ CÁCH TRUYỀN THỐNG LÀ DÙNG CODE THÌ ĐƯỢC
