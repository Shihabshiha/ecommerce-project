module.exports = {
  inc: (value) => {
      return parseInt(value) + 1
  },
  multiply:(a,b)=>{
    return a*b
  },
  eq: (a, b) => {
      return a === b
  },
  or: function (a, b, options){
    if (a || b) {
        return options.fn(this)
    } else {
        return options.inverse(this)
      }
   },

  not: function (value) {
      return !value
  },
  notNull: (value, options) => {
      if (value !== null) {
          return options.fn(this)
      } else {
          return options.inverse(this)
      }
  },
  formatMoney:(amount) =>{
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatter.format(amount);    
  },
  formatDate: (date) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    return formatter.format(date);
  },

  lookup:(value, items)=>{
    const item = items.find(item => item._id.toString() === value.toString());
    return item;
  },
  JSONstringify: function(obj) {
    return JSON.stringify(obj);
  }
  
}
