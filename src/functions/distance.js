export const formula = (lat1, long1, lat2, long2) => {
    const dis = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(long1 - long2, 2));
    const miles = dis * 0.0001893939;
    const rounded = ("" + miles).substring(0, 3);
    if (miles < 0.1) {
        return Math.ceil(dis) + " Feet";
    }
    return rounded + " Miles";
}