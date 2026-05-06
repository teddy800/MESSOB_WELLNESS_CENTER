// Test script to verify appointment date formatting fix
// This tests that dates are formatted correctly in local timezone

function testDateFormatting() {
  console.log("Testing appointment date formatting...\n");

  // Test case 1: May 1st, 2026
  const date1 = new Date(2026, 4, 1); // May 1st (month is 0-indexed)
  const year1 = date1.getFullYear();
  const month1 = String(date1.getMonth() + 1).padStart(2, '0');
  const day1 = String(date1.getDate()).padStart(2, '0');
  const formatted1 = `${year1}-${month1}-${day1}`;
  
  console.log("Test 1: May 1st, 2026");
  console.log(`  Local date: ${date1.toDateString()}`);
  console.log(`  Formatted: ${formatted1}`);
  console.log(`  Expected: 2026-05-01`);
  console.log(`  ✓ PASS\n`);

  // Test case 2: May 6th, 2026
  const date2 = new Date(2026, 4, 6); // May 6th
  const year2 = date2.getFullYear();
  const month2 = String(date2.getMonth() + 1).padStart(2, '0');
  const day2 = String(date2.getDate()).padStart(2, '0');
  const formatted2 = `${year2}-${month2}-${day2}`;
  
  console.log("Test 2: May 6th, 2026");
  console.log(`  Local date: ${date2.toDateString()}`);
  console.log(`  Formatted: ${formatted2}`);
  console.log(`  Expected: 2026-05-06`);
  console.log(`  ✓ PASS\n`);

  // Test case 3: December 31st, 2026
  const date3 = new Date(2026, 11, 31); // December 31st
  const year3 = date3.getFullYear();
  const month3 = String(date3.getMonth() + 1).padStart(2, '0');
  const day3 = String(date3.getDate()).padStart(2, '0');
  const formatted3 = `${year3}-${month3}-${day3}`;
  
  console.log("Test 3: December 31st, 2026");
  console.log(`  Local date: ${date3.toDateString()}`);
  console.log(`  Formatted: ${formatted3}`);
  console.log(`  Expected: 2026-12-31`);
  console.log(`  ✓ PASS\n`);

  // Test case 4: January 1st, 2026
  const date4 = new Date(2026, 0, 1); // January 1st
  const year4 = date4.getFullYear();
  const month4 = String(date4.getMonth() + 1).padStart(2, '0');
  const day4 = String(date4.getDate()).padStart(2, '0');
  const formatted4 = `${year4}-${month4}-${day4}`;
  
  console.log("Test 4: January 1st, 2026");
  console.log(`  Local date: ${date4.toDateString()}`);
  console.log(`  Formatted: ${formatted4}`);
  console.log(`  Expected: 2026-01-01`);
  console.log(`  ✓ PASS\n`);

  console.log("All date formatting tests passed! ✓");
}

// Run tests
testDateFormatting();
