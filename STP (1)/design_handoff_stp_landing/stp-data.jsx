
// Mock data for STP prototype

const JOBS = [
  { id: 1, title: "CE-chaufför, fjärrtrafik", company: "Nordic Transport AB", location: "Malmö", region: "Skåne", license: "CE", salary: "32 000", employment: "Fast", match: 94, segment: "FULLTIME", kollektivavtal: true, verified: true, color: "#1F5F5C" },
  { id: 2, title: "Distributionschaufför C", company: "PostNord Logistics", location: "Stockholm", region: "Stockholm", license: "C", salary: "28 500", employment: "Fast", match: 81, segment: "FULLTIME", kollektivavtal: true, verified: true, color: "#2D4A3E" },
  { id: 3, title: "Tankbilschaufför ADR", company: "Preem AB", location: "Göteborg", region: "Västra Götaland", license: "CE", salary: "35 000", employment: "Fast", match: 76, segment: "FULLTIME", kollektivavtal: false, verified: true, color: "#1a3a5c" },
  { id: 4, title: "Vikarie CE, helger", company: "Schenker Åkeri", location: "Linköping", region: "Östergötland", license: "CE", salary: "260 kr/h", employment: "Vikariat", match: 68, segment: "FLEX", kollektivavtal: true, verified: false, color: "#3a2d5c" },
  { id: 5, title: "Lastbilschaufför C lokal", company: "Svensk Cementering", location: "Uppsala", region: "Uppsala", license: "C", salary: "29 000", employment: "Fast", match: 62, segment: "FULLTIME", kollektivavtal: true, verified: true, color: "#1F5F5C" },
];

const COMPANIES = [
  { id: 1, name: "Nordic Transport AB", region: "Skåne", segment: "Fjärrtrafik", activeJobs: 3, rating: 4.6, reviews: 14, verified: true },
  { id: 2, name: "PostNord Logistics", region: "Stockholm", segment: "Distribution", activeJobs: 7, rating: 4.2, reviews: 38, verified: true },
  { id: 3, name: "Preem AB", region: "Västra Götaland", segment: "Tank/ADR", activeJobs: 2, rating: 4.8, reviews: 9, verified: true },
  { id: 4, name: "Schenker Åkeri", region: "Östergötland", segment: "Styckegods", activeJobs: 5, rating: 3.9, reviews: 22, verified: true },
  { id: 5, name: "DB Schenker", region: "Stockholm", segment: "Terminallogistik", activeJobs: 4, rating: 4.4, reviews: 17, verified: false },
];

const NOTIFICATIONS = [
  { id: 1, type: "match", icon: "🎯", title: "Ny stark match!", body: "Nordic Transport AB gillar din profil", time: "2 min", unread: true },
  { id: 2, type: "message", icon: "💬", title: "Nytt meddelande", body: "PostNord Logistics: Hej! Vi är intresserade av...", time: "1 h", unread: true },
  { id: 3, type: "job", icon: "📋", title: "Nytt jobb matchar dig", body: "CE-chaufför ADR i Skåne – 94% match", time: "3 h", unread: false },
  { id: 4, type: "match", icon: "⭐", title: "Preem AB super-matchade dig", body: "De söker en chaufför med exakt din profil", time: "igår", unread: false },
  { id: 5, type: "view", icon: "👁", title: "3 åkerier tittade på din profil", body: "Nordic, Schenker, DB Schenker", time: "igår", unread: false },
];

Object.assign(window, { JOBS, COMPANIES, NOTIFICATIONS });
