import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure Organization exists
  let org = await prisma.organization.findFirst({
    where: { name: 'Arpit Solar & Electricals' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Arpit Solar & Electricals'
      }
    });
  }

  const products = [
    {
      name: 'AC Wire 4MM HPL (4 sq mm Copper AC Cable)',
      sku: 'APL-ACW-4H',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 55,
    },
    {
      name: 'AC Wire 4MM Polycab (4 sq mm Copper AC Cable)',
      sku: 'APL-ACW-4P',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 62,
    },
    {
      name: 'AC Wire 6MM HPL (6 sq mm Copper AC Cable)',
      sku: 'APL-ACW-6H',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 81,
    },
    {
      name: 'AC Wire 6MM Polycab (6 sq mm Copper AC Cable)',
      sku: 'APL-ACW-6P',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 81,
    },
    {
      name: 'ACDB 1PH (Single Phase AC Distribution Box with MCB & SPD)',
      sku: 'APL-ACDB-1PH',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'ACDB 3PH (Three Phase AC Distribution Box with 4P MCB/MCCB & SPD)',
      sku: 'APL-ACDB-3PH',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Base Plate 140X50 (Heavy Duty Base Plate for 140x50 Column)',
      sku: 'APL-BP-14050',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 190,
    },
    {
      name: 'Base Plate 80X40 (Base Plate for 80x40 Column/Leg Mounting)',
      sku: 'APL-BP-8040',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 190,
    },
    {
      name: 'DC Wire 4MM HPL (100Mtr Bundle Tinned Copper Solar Cable)',
      sku: 'APL-DCW-4H',
      category: 'Wires & Cables',
      unit: 'BDL',
      gstPercent: 18,
      baseRate: 51,
    },
    {
      name: 'DC Wire 4MM Polycab (100Mtr Bundle Cross-Linked Solar Cable)',
      sku: 'APL-DCW-4P',
      category: 'Wires & Cables',
      unit: 'BDL',
      gstPercent: 18,
      baseRate: 55,
    },
    {
      name: 'DCDB 1 IN 1 OUT (1 String In 1 Out 1000V DC SPD + Fuse)',
      sku: 'APL-DCDB-1I1O',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'DCDB 2 IN 1 OUT (2 String In 1 Out Combined DC Distribution Box)',
      sku: 'APL-DCDB-2I1O',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'DCDB 2 IN 2 OUT (Dual Tracker 2 In 2 Out DC Distribution Box)',
      sku: 'APL-DCDB-2I2O',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'DCDB 3 IN 1 OUT (3 String In 1 Out Multi-MPPT Distribution Box)',
      sku: 'APL-DCDB-3I1O',
      category: 'Electrical Panels',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Degree Hanger (Tilt Angle Adjustment Degree Hanger Bracket)',
      sku: 'APL-DH-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Earthing Rod 1mtr (1 Meter Copper Bonded / GI Chemical Electrode)',
      sku: 'APL-ER-1M',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 179,
    },
    {
      name: 'Earthing Rod 2mtr (2 Meter Copper Bonded / GI Heavy Electrode)',
      sku: 'APL-ER-2M',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 299,
    },
    {
      name: 'Earthing Wire 10MM ALU (10 sq mm Aluminum Earthing Conductor)',
      sku: 'APL-EW-10A',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 1350,
    },
    {
      name: 'Earthing Wire 16MM ALU (16 sq mm Heavy Aluminum Conductor)',
      sku: 'APL-EW-16A',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 1950,
    },
    {
      name: 'Earthing Wire 6MM CCA (6 sq mm Copper Clad Aluminum Earthing Wire)',
      sku: 'APL-EW-6C',
      category: 'Wires & Cables',
      unit: 'Mtr',
      gstPercent: 18,
      baseRate: 1650,
    },
    {
      name: 'End Clamp (Aluminum / GI End Clamp for Module Framing)',
      sku: 'APL-EC-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 25,
    },
    {
      name: 'L.A. Metal Base (Heavy Metal Base Bracket for Lightning Mast)',
      sku: 'APL-LAB-MTL',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'L.A. PVC Base (Insulating PVC Mounting Base for Lightning Arrestor)',
      sku: 'APL-LAB-PVC',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'L.A. Red Insulator Base (High Voltage Red Resin Insulator Base)',
      sku: 'APL-LAB-RED',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Lightning Arrestor (ESE / Multi-Spike Copper Lightning Spike)',
      sku: 'APL-LA-001',
      category: 'Earthing & Lightning',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'MC-4 Connector (IP68 1500V Male & Female Solar MC4 Connectors)',
      sku: 'APL-MC4-001',
      category: 'Accessories',
      unit: 'Pair',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Mid Clamp (Aluminum / GI Mid Clamp for Module Framing)',
      sku: 'APL-MC-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 25,
    },
    {
      name: 'Nut Bolt Washer (SS304 / GI Grade 8.8 Nut, Bolt & Spring Washer)',
      sku: 'APL-NBW-001',
      category: 'Fasteners & Hardware',
      unit: 'KG',
      gstPercent: 18,
      baseRate: 120,
    },
    {
      name: 'Pit Cover (Heavy Duty Plastic / FRP Earth Pit Chamber Cover)',
      sku: 'APL-PIT-001',
      category: 'Accessories',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 142,
    },
    {
      name: 'Purlin 12ft 41X41 (12ft 41x41mm C-Channel Solar Mounting Purlin)',
      sku: 'APL-PUR-1241',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Purlin 21ft 41X41 (21ft 41x41mm C-Channel Solar Mounting Purlin)',
      sku: 'APL-PUR-2141',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Purlin Jointer (Internal/External Purlin Connector)',
      sku: 'APL-PJ-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Rafter 12ft 80X40 (12ft 80x40mm Structure Rafter Section)',
      sku: 'APL-RAF-1280',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Rafter 21ft 140X50 (21ft 140x50mm Heavy Duty Structure Rafter)',
      sku: 'APL-RAF-21140',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Rafter 21ft 80X40 (21ft 80x40mm Hot Dip Pre-Galvanised Structure Rafter)',
      sku: 'APL-RAF-2180',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Rafter Jointer (Heavy Duty Rafter Splice Connector)',
      sku: 'APL-RJ-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    },
    {
      name: 'Solgrip Universal Clamp (Universal Module Clamp with Grounding Teeth)',
      sku: 'APL-SUC-001',
      category: 'Clamps & Joiners',
      unit: 'Pcs',
      gstPercent: 18,
      baseRate: 1,
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }

  console.log(`Seeded ${products.length} official solar products!`);

  // Create the official Master Vendor Order & Quotation Form
  const formTitle = 'Arpit Solar - Vendor Equipment Order & Quotation Form (RFQ)';
  let form = await prisma.form.findFirst({
    where: { title: formTitle }
  });

  if (!form) {
    form = await prisma.form.create({
      data: {
        organizationId: org.id,
        title: formTitle,
        description: 'Official wholesale procurement portal for EPC contractors, dealers, and installation vendors. Select required materials and quantities below to receive an automated GST proforma quotation and delivery schedule.',
        isPublished: true,
        fields: {
          create: [
            {
              type: 'TEXT',
              label: 'Vendor / Firm Name',
              placeholder: 'e.g. Apex Solar Power Pvt Ltd',
              required: true,
              order: 1
            },
            {
              type: 'TEXT',
              label: 'Contact Person & Mobile / WhatsApp Number',
              placeholder: 'e.g. Rahul Sharma (+91 98765 43210)',
              required: true,
              order: 2
            },
            {
              type: 'TEXT',
              label: 'GSTIN Number (For Input Tax Credit / Proforma Invoice)',
              placeholder: 'e.g. 07AAACA1234F1Z8',
              required: false,
              order: 3
            },
            {
              type: 'PARAGRAPH',
              label: 'Delivery Site Address & Destination Pincode',
              placeholder: 'Complete address where materials need to be dispatched',
              required: true,
              order: 4
            },
            {
              type: 'PRODUCT_TABLE',
              label: 'Select Required Solar Materials & Quantities',
              placeholder: 'Choose quantities for Wires, Mounting Structures, Clamps, Distribution Boxes, and Lightning Arrestors',
              required: true,
              order: 5
            },
            {
              type: 'PARAGRAPH',
              label: 'Special Requirements / Delivery Instructions',
              placeholder: 'Mention if crane/unloading required, urgent dispatch, or specific cable lengths needed...',
              required: false,
              order: 6
            }
          ]
        }
      }
    });
    console.log(`Created Master Vendor Order Form with ID: ${form.id}`);
  } else {
    console.log(`Master Vendor Order Form already exists with ID: ${form.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
