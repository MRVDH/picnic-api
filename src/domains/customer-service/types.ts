export type OpeningTime = {
  start: number[]; // e.g. [8, 0]
  end: number[]; // e.g. [23, 0]
};

export type OpeningTimes = {
  [date: string]: OpeningTime; // key is a date string e.g. "2026-02-25"
};

export type ContactDetails = {
  email: string;
  phone: string;
  whatsapp: string;
};

export type CustomerServiceContactInfo = {
  contact_details: ContactDetails;
  opening_times: OpeningTimes;
};
