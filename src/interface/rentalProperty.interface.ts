export interface RentalPropertyInterface {
    id: string;
    rentCastId: string;
    formattedAddress: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    stateFips: number;
    zipCode: number;
    county: string;
    countyFips: number;
    latitude: number;
    longitude: number;
    propertyType: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    lotSize: number;
    yearBuilt: number;
}
