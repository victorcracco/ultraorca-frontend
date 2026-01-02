const KEY = "orcasimples_company";

export function getCompanyData() {
  const data = localStorage.getItem(KEY);
  return data
    ? JSON.parse(data)
    : {
        companyName: "",
        phone: "",
        email: "",
        logo: "",
        validityDays: 7,
        message: "",
      };
}

export function saveCompanyData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
