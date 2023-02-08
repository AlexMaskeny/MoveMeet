export const formula = (lat1, long1, lat2, long2) => {
    const dis = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(long1 - long2, 2));
    const miles = dis * 0.0001893939;
    const rounded = ("" + miles).substring(0, 3);
    if (dis < 500) {
        if (dis < 25) {
            return "< 25 ft away";
        }
        if (dis < 50) {
            return "< 50 ft away";
        }
        if (dis < 100) {
            return "< 100 ft away";
        }
        if (dis < 500) {
            return "< 500 ft away";
        }
        //return Math.ceil(dis) + " Feet";
    }
    return rounded + " Miles";
}
export const raw = (lat1, long1, lat2, long2) => {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(long1 - long2, 2));
   
}