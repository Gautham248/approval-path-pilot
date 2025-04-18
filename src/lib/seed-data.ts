
import { addItem } from "@/lib/db";
import { User, TravelRequest, TicketOption, UserRole } from "@/types";

// Seed users for initial testing
export const seedUsers = async (): Promise<void> => {
  const users: Omit<User, "id">[] = [
    {
      name: "John Employee",
      role: "employee",
      department: "Engineering",
      email: "john@example.com",
      hierarchy_chain: [2, 4], // Manager -> DU Head
      avatar: "https://ui-avatars.com/api/?name=John+Employee&background=0D8ABC&color=fff"
    },
    {
      name: "Sarah Manager",
      role: "manager",
      department: "Engineering",
      email: "sarah@example.com",
      hierarchy_chain: [4], // DU Head
      avatar: "https://ui-avatars.com/api/?name=Sarah+Manager&background=2E8B57&color=fff"
    },
    {
      name: "Mike Admin",
      role: "admin",
      department: "Travel",
      email: "mike@example.com",
      hierarchy_chain: [],
      avatar: "https://ui-avatars.com/api/?name=Mike+Admin&background=8B5CF6&color=fff"
    },
    {
      name: "Lisa DU Head",
      role: "du_head",
      department: "Engineering",
      email: "lisa@example.com",
      hierarchy_chain: [],
      avatar: "https://ui-avatars.com/api/?name=Lisa+Head&background=D946EF&color=fff"
    },
    {
      name: "Alex Employee",
      role: "employee",
      department: "Marketing",
      email: "alex@example.com",
      hierarchy_chain: [2, 4],
      avatar: "https://ui-avatars.com/api/?name=Alex+Employee&background=F97316&color=fff"
    }
  ];

  // Add each user to the database
  for (const user of users) {
    try {
      await addItem("users", user);
    } catch (error) {
      console.error("Error adding user:", error);
    }
  }

  console.log("Users seeded successfully");
};

// Seed sample travel requests for testing
export const seedTravelRequests = async (): Promise<void> => {
  // Get user IDs first
  try {
    const currentDate = new Date();
    const oneWeekLater = new Date(currentDate);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const twoWeeksLater = new Date(currentDate);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    const threeWeeksLater = new Date(currentDate);
    threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

    const requestsToSeed: Omit<TravelRequest, "request_id">[] = [
      {
        current_status: "draft",
        requester_id: 1, // John Employee
        travel_details: {
          source: "New York",
          destination: "San Francisco",
          start_date: oneWeekLater.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          purpose: "Annual Developer Conference",
          project_code: "DEV-2023",
          estimated_cost: 2500
        },
        approval_chain: [
          { role: "manager", user_id: 2 },
          { role: "du_head", user_id: 4 },
          { role: "admin", user_id: 3 }
        ],
        version_history: [
          {
            timestamp: new Date().toISOString(),
            user_id: 1,
            changeset: { type: "create", details: "Initial request creation" }
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        current_status: "manager_pending",
        requester_id: 5, // Alex Employee
        travel_details: {
          source: "Chicago",
          destination: "Miami",
          start_date: twoWeeksLater.toISOString(),
          end_date: threeWeeksLater.toISOString(),
          purpose: "Client Meeting",
          project_code: "CLIENT-XYZ",
          estimated_cost: 1800
        },
        approval_chain: [
          { role: "manager", user_id: 2 },
          { role: "du_head", user_id: 4 },
          { role: "admin", user_id: 3 }
        ],
        version_history: [
          {
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: 5,
            changeset: { type: "create", details: "Initial request creation" }
          },
          {
            timestamp: new Date().toISOString(),
            user_id: 5,
            changeset: { type: "submit", details: "Submitted for approval" }
          }
        ],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const request of requestsToSeed) {
      const requestId = await addItem("requests", request);
      
      // If a request is in a state where tickets are added
      if (request.current_status === "manager_selection") {
        await seedTicketOptions(requestId as number);
      }
    }

    console.log("Travel requests seeded successfully");
  } catch (error) {
    console.error("Error seeding travel requests:", error);
  }
};

// Seed ticket options for a specific request
export const seedTicketOptions = async (requestId: number): Promise<void> => {
  const currentDate = new Date();
  const oneMonthLater = new Date(currentDate);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const ticketsToSeed: Omit<TicketOption, "option_id">[] = [
    {
      request_id: requestId,
      carrier: "American Airlines",
      class: "Economy",
      price: 450,
      departure_time: "2023-12-15T08:00:00Z",
      arrival_time: "2023-12-15T11:30:00Z",
      validity_start: currentDate.toISOString(),
      validity_end: oneMonthLater.toISOString(),
      added_by_admin_id: 3,
      added_date: new Date().toISOString(),
      carrier_rating: 4.2,
      refundable: true,
      flight_duration: "3h 30m",
      stops: 0
    },
    {
      request_id: requestId,
      carrier: "Delta",
      class: "Economy Plus",
      price: 650,
      departure_time: "2023-12-15T10:00:00Z",
      arrival_time: "2023-12-15T13:15:00Z",
      validity_start: currentDate.toISOString(),
      validity_end: oneMonthLater.toISOString(),
      added_by_admin_id: 3,
      added_date: new Date().toISOString(),
      carrier_rating: 4.5,
      refundable: true,
      flight_duration: "3h 15m",
      stops: 0
    },
    {
      request_id: requestId,
      carrier: "United",
      class: "Business",
      price: 1200,
      departure_time: "2023-12-15T07:30:00Z",
      arrival_time: "2023-12-15T10:45:00Z",
      validity_start: currentDate.toISOString(),
      validity_end: oneMonthLater.toISOString(),
      added_by_admin_id: 3,
      added_date: new Date().toISOString(),
      carrier_rating: 4.0,
      refundable: false,
      flight_duration: "3h 15m",
      stops: 0
    }
  ];

  for (const ticket of ticketsToSeed) {
    try {
      await addItem("ticketOptions", ticket);
    } catch (error) {
      console.error("Error adding ticket option:", error);
    }
  }

  console.log(`Ticket options seeded for request ${requestId}`);
};

// Function to initialize all seed data
export const initializeSeedData = async (): Promise<void> => {
  await seedUsers();
  await seedTravelRequests();
};
