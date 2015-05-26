/**
* MouseTracker main file
* @author Jan Busfy
*/
(function(){
	
	/**
	* Default values for plugin initialization
	*/ 
	var DEFAULTS = {
		remember_user: false		
	};

	/**
	* Storage prefix for all keys used in storage
	*/ 
	var STORAGE_PREFIX = "mouseTracker-";

	/**
	* API - interface to interact with the plugin
	* Instance of this class is returned to the user
	* @param delegate - delegate for handling user requests
	*/
	function API(delegate){
		//this object
		var _this = this;

		//delegate handler
		_this.delegate = delegate;

		/**
		* Test function for testing purposes
		*/ 
		_this.getDistanceTraveled = function(){
			return _this.delegate.getDistanceTraveled();
		};
	};

	/**
	* MouseTracker - main initialization object
	* @param array config - plugin init config
	*/
	function MouseTracker(config){
		//this object
		var _this = this;	
		
		//default config		
		_this.config = DEFAULTS;				

		//actual distance in PX
		_this.actualDistance = 0;

		//utility helper
		_this.utility = new Utility();

		/**
		* Initialization function
		* @param array config - user filled config
		*/
		_this.init = function(config){	
			//update defaults with user filled config		
			_this.updateConfig(config);			

			//initialize mouse tracking manager
			_this.trackingManager.init();			

			//load storage data if remember_user is true
			if(true === _this.config.remember_user){
				var savedDistance = _this.storageManager.getKey("distanceTraveled");
				if(false !== savedDistance){
					_this.actualDistance = parseFloat(savedDistance);
				}				
			}
			else{
				_this.storageManager.deleteKey("distanceTraveled");
			}			
		};

		/**
		* Updates config with values user has filled
		* @param array config - user filled config
		*/ 
		_this.updateConfig = function(config){
			//replace defaults with filled values from user
			for(var i in config){
				_this.config[i] = config[i];
			}
		}

		/**
		* Returns actual traveled distance in MM
		* @return float - actual traveled distance
		*/
		_this.apiGetDistanceTraveled = function(){
			return _this.utility.convertPixelsToMilimeters(_this.actualDistance);
		};

		/**
		* Fired when distance in tracking manager changes		
		* @param float gain - distance gain
		*/
		_this.trackingManagerDistanceChanged = function(gain){
			_this.actualDistance += gain;			
			
			//save if remembering user
			if(_this.config.remember_user){				
				_this.storageManager.setKey("distanceTraveled", _this.actualDistance);
			}
		};

		//delegate handler objects
		_this.apiDelegate = {
			getDistanceTraveled: apiGetDistanceTraveled
		};

		_this.trackingDelegate = {
			distanceChanged: _this.trackingManagerDistanceChanged
		};		

		//managers
		_this.trackingManager = new TrackingManager(_this.trackingDelegate, _this.utility);
		_this.storageManager = new StorageManager();		

		//initialize self with user filled config
		_this.init(config);

		//create and return API
		return new API(_this.apiDelegate);	
	};	

	/**
	* TrackingManager provides support for handling mouse events
	* @param object delegate - events handler
	* @param Utility utility - helper object
	*/
	function TrackingManager(delegate, utility){
		//this object
		var _this = this;

		//delegate
		_this.delegate = delegate;		

		//utility
		_this.utility = utility;

		//boolean indicating whether first move was done or not
		//helps preventing initial distance jump after init when mouse is in the center of the screen 
		//and not in top left corner
		_this.firstMove = false;

		//last position coordinates of mouse		
		_this.lastMousePosition = {x: 0, y: 0};		

		/**
		* Initializes tracking events and handler functions
		*/
		_this.init = function(){			
			//bind mouse callbacks
			_this.bindCallbacks();
		};


		/**
		* Binds mouse callbacks
		*/
		_this.bindCallbacks = function(){
			//bind 'mousemove' callback
			document.addEventListener("mousemove", _this.handleMouseMove);
		};

		/**
		* Triggered on 'mousemove' event
		* @param array event - event data
		*/
		_this.handleMouseMove = function(event){									
			var currentMousePosition = {x: event.pageX, y: event.pageY};			

			//avoid first move jump
			if(false === _this.firstMove){
				_this.firstMove = true;
				_this.lastMousePosition = currentMousePosition;
				return;				
			}

			//calculate distance traveled
			var distanceTraveled = _this.utility.computeDistance(
				_this.lastMousePosition, currentMousePosition
			);			
			_this.lastMousePosition = currentMousePosition;

			//let delegate know
			_this.delegate.distanceChanged(distanceTraveled);			
		};		
	};	

	/**
	* StorageManager provides support for data persistence
	*/
	function StorageManager(){
		//this object
		var _this = this;


		/**
		* Sets the key and value in storage
		* @param string key - key to be set
		* @param string value - value to be set
		*/
		_this.setKey = function(key, value){
			window.localStorage[STORAGE_PREFIX + key] = value;
		};

		/**
		* Retrieves value for the key from the storage
		* @param string key - key to identify item
		* @return string|boolean - value for the key or boolean false if the key is not set
		*/
		_this.getKey = function(key){
			return window.localStorage[STORAGE_PREFIX + key] !== undefined
				? window.localStorage[STORAGE_PREFIX + key] : false;
		};

		/**
		* Removes a key from storage
		* @param string key - key to be removed
		*/
		_this.deleteKey = function(key){
			delete window.localStorage[STORAGE_PREFIX + key];
		};


	};

	/**
	* Utility provides support for various operations( f.e. distance calculation, ...)
	*/
	function Utility(){
		//this object
		var _this = this;


		/**
		* Computes the distance between two points in 2D area
		* @param array pointX - first point
		* @param array pointY - second point
		* @return float - distance
		*/
		_this.computeDistance = function(pointX, pointY){
			return Math.sqrt(
				parseFloat(Math.pow((pointX.x - pointY.x), 2) + Math.pow(pointX.y - pointY.y, 2))
			);
		};

		/**
		* Conversion function. Converts PX to MM
		* @param float pixels - PX units
		* @return float - MM units
		*/
		_this.convertPixelsToMilimeters = function(pixels){
			return (pixels * 2.54 / 96) * 10;
		};
	};


	//show API to the world
	window.MouseTracker = MouseTracker;

})();