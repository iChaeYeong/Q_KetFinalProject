export type AdminUser = {
  userId: string;
  userNm: string;
  userEmail: string;
  userStatus: string;
  roleId: number;
  roleName: string;
};

export type Role = {
  roleId: number;
  roleName: string;
};

export type Venue = {
  venueId: number;
  venueName: string;
};
