(function(tim, jQuery){
	var _name = 'time';

	/**
	 * helper for time
	 * provides some higher level functions for date manipulation.
	 * @module time
	 * @implements Helper
	 */
	var time = (function(){
		var _ = {};

		/**
		 * get the name of the helper
		 * @return {String} returns the name
		 */
		_.getName = function(){
			return _name;
		};
		
		/**
		 * computes the difference between the months of two date objects
		 * @param  {Date|DateString} date1
		 * @param  {Date|DateString} date2
		 * @return {Integer} returns the number of months 
		 */
		_.monthDiff = function(date1, date2) {
			if(typeof date1 == 'string') date1 = new Date(date1);
			if(typeof date2 == 'string') date2 = new Date(date2);
			var months;
			months = (date2.getFullYear() - date1.getFullYear()) * 12;
			months -= date1.getMonth();
			months += date2.getMonth();
			return months <= 0 ? 0 : months;
		};

		/**
		 * computes the difference in days between two date objects	
		 * @param  {Date|DateString} date1
		 * @param  {Date|DateString} date2
		 * @return {Integer} returns the number of days
		 */
		_.dayDiff = function(date1, date2) {
			if(typeof date1 == 'string') date1 = new Date(date1);
			if(typeof date2 == 'string') date2 = new Date(date2);
			return Math.floor((date2 - date1) / (24 * 60 * 60 * 1000));
		};

		var monthNames = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];

		_.formatDate = function(date){
			if(typeof date == 'string') date = new Date(date);
			var str = date.toISOString();
			return str.replace(/T.*/, "").split("-").reverse().join(".");
		};

		/**
		 * returns a name corresponding to the provided month
		 * @param  {Integer} month the month i.e. 0-11
		 * @return {String} returns the month's name
		 */
		_.monthName = function(month){
			month = month % 12;
			return monthNames[month];
		};

		/**
		 * add an amount of month to a date object
		 * @param {Date|DateString} date   the date
		 * @param {Integer} amount the amount of months to add
		 * @return {Date} returns a new Date object with the month added
		 */
		_.addMonths = function(date, amount) {
			date = new Date(date);
			var desiredMonth = date.getMonth() + amount;
			var desiredYear = date.getFullYear() + Math.floor(desiredMonth / 12);
			date.setMonth(desiredMonth % 12);
			date.setFullYear(desiredYear);
			return date;
		};

		/**
		 * add an amount of days to a date object
		 * @param {Date|DateString} date   the date
		 * @param {Integer} amount the amount of days to add
		 * @return {Date} returns a new Date object with the days added
		 */
		_.addDays = function(date, amount) {
			date = new Date(date);
			date.setDate(date.getDate() + amount);
			return date;
		};

		/**
		 * checks if a date is invalid
		 * @param {Date|DateString} date   the date
		 * @return {Boolean} returns true if date is invalid
		 */
		_.isDateInvalid = function(date) {
			if(!date) return true;
			else return false;
		};

		/**
		 * compares two dates, if one is later than the other
		 * @param {Date|DateString} date to be checked
		 * @param {Date|DateString} date which is used as reference
		 * @return {Boolean} returns true if date1 is later than date2
		 */
		_.isDateLaterThan = function(date1, date2) {
			if(date1 > date2) return true;
			else return false;
		};

		/**
		 * checks if a date is later than today
		 * @param {Date|DateString} date   the date
		 * @return {Boolean} returns true if date is later than today
		 */
		_.isDateLaterThanToday = function(date) {
			return _.isDateLaterThan(new Date());
		};

		return _;
	})();

	tim.helper.add(time);

})(aigTim, jQuery);