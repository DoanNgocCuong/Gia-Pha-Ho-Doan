// Script to parse Gia Phả markdown table and generate familyTree.ts
const fs = require('fs');

const md = fs.readFileSync('./CKP/v2/Gia Phả - Định Dạng Bảng.md', 'utf8');

// Parse markdown table
const lines = md.split('\n');
const dataLines = lines.filter(l => l.match(/^\| m\d+/));

const persons = new Map();

for (const line of dataLines) {
  const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
  const id = cols[0];
  const name = cols[1];
  const genderRaw = cols[2].toLowerCase();
  const gender = genderRaw === 'male' ? 'male' : 'female';
  const parentId = cols[4] || '';
  const note = cols[9] || '';

  let fullName = note ? `${name} (${note})` : name;

  persons.set(id, {
    id,
    name: fullName,
    gender,
    parentId,
    note,
    children: []
  });
}

// Build tree: assign children to parents
for (const [id, person] of persons) {
  if (person.parentId && persons.has(person.parentId)) {
    persons.get(person.parentId).children.push(person);
  }
}

// Convert internal map entry to Person object (recursive, returns shallow copy)
function personToObj(p) {
  const obj = { name: p.name, gender: p.gender };
  if (p.children.length > 0) {
    obj.children = p.children.map(personToObj);
  }
  return obj;
}

const m1 = persons.get('m1');   // Cụ Rũng
const m2 = persons.get('m2');   // NHÁNH I (I. Cụ Hán)
const m452 = persons.get('m452'); // NHÁNH II
const m552 = persons.get('m552'); // NHÁNH III

// NHÁNH II and III descend from Cả Tụng/Sáng (m430/m431) in the raw data.
// For the tree layout, they should be direct children of Cụ Rũng alongside NHÁNH I.
// Build independent subtrees for each branch.
const nhanh1 = personToObj(m2);
const nhanh2 = personToObj(m452);
const nhanh3 = personToObj(m552);

// Root: Cụ ô Liễu – Cụ B.Hàng
// Cụ Rũng has 3 children: NHÁNH I, NHÁNH II, NHÁNH III
// (NHÁNH II/III come from Cả Tụng/Sáng lineage in reality, but appear as
// siblings of NHÁNH I in the visual tree layout)
const root = {
  name: "Cụ ô Liễu M20.10 – Cụ B.Hàng",
  gender: "ancestor",
  children: [
    {
      name: m1 ? m1.name : "Cụ Rũng",
      gender: m1 ? m1.gender : "female",
      children: [nhanh1, nhanh2, nhanh3]
    }
  ]
};

const tsContent = `// Family tree data for Họ Đoàn - Generated from CKP/v2/Gia Phả - Định Dạng Bảng.md
// ${persons.size} members

export interface Person {
  name: string;
  gender: 'male' | 'female' | 'ancestor' | 'other';
  children?: Person[];
}

export const familyTree: Person = ${JSON.stringify(root, null, 2)};
`;

fs.writeFileSync('./client/src/data/familyTree.ts', tsContent);
console.log('Generated familyTree.ts');
console.log('Total persons:', persons.size);

// Verify structure
const branches = root.children[0].children;
console.log('Branch count:', branches.length);
branches.forEach((b, i) => console.log(`  [${i}] ${b.name} (${b.children ? b.children.length : 0} children)`));
