/**
 * HR Integration Service
 * 
 * Phase 1: Stubbed implementation with mock data
 * Phase 2: Will integrate with actual Mesob HR API
 */

interface EmployeeData {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  region: string;
  center: string;
}

// Mock employee data for testing
const mockEmployees: Record<string, EmployeeData> = {
  "EMP001": {
    employeeId: "EMP001",
    fullName: "Abebe Kebede",
    email: "abebe.kebede@mesob.com",
    phone: "+251911234567",
    dateOfBirth: "1990-01-15",
    gender: "MALE",
    region: "Addis Ababa",
    center: "Main Health Center",
  },
  "EMP002": {
    employeeId: "EMP002",
    fullName: "Tigist Haile",
    email: "tigist.haile@mesob.com",
    phone: "+251922345678",
    dateOfBirth: "1992-05-20",
    gender: "FEMALE",
    region: "Addis Ababa",
    center: "Bole Health Center",
  },
  "EMP003": {
    employeeId: "EMP003",
    fullName: "Dawit Tesfaye",
    email: "dawit.tesfaye@mesob.com",
    phone: "+251933456789",
    dateOfBirth: "1988-11-10",
    gender: "MALE",
    region: "Oromia",
    center: "Adama Health Center",
  },
};

/**
 * Fetch employee data by employee ID
 * 
 * @param employeeId - The employee ID to look up
 * @returns Employee data if found, null otherwise
 */
export async function getEmployeeById(employeeId: string): Promise<EmployeeData | null> {
  // TODO: Phase 2 - Replace with actual HR API call
  // const response = await fetch(`${HR_API_URL}/employees/${employeeId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${HR_API_TOKEN}`,
  //   },
  // });
  // return response.json();

  // Phase 1: Return mock data
  return mockEmployees[employeeId] || null;
}
