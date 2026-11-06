export const demoShipments = [
 {id:"1047",reference:"1047",customerName:"John Doe Logistics",pickupAddress:"Dallas, TX",dropoffAddress:"Houston, TX",status:"IN_TRANSIT",rateCents:125000,driverName:"Mike Johnson",freightType:"Vehicle"},
 {id:"1046",reference:"1046",customerName:"ABC Logistics",pickupAddress:"Austin, TX",dropoffAddress:"San Antonio, TX",status:"DELIVERED",rateCents:98000,driverName:"Sarah Lee",freightType:"General Freight"},
 {id:"1045",reference:"1045",customerName:"XYZ Distribution",pickupAddress:"Houston, TX",dropoffAddress:"Dallas, TX",status:"PICKED_UP",rateCents:145000,driverName:"Chris Taylor",freightType:"Automotive Parts"},
 {id:"1044",reference:"1044",customerName:"Metro Freight",pickupAddress:"Fort Worth, TX",dropoffAddress:"Waco, TX",status:"BOOKED",rateCents:76000,driverName:"Unassigned",freightType:"General Freight"}
];
export const money = (cents:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
