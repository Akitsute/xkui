class xkui{
	constructor(){
		this.container = document.body;

		this.views = {};
		this.view = {};

		this.components = {};

		//XKE - XKElements
		//XKS - XKStyles
		//XKC - XKCode
		
		this.xkattributeAnalyser = new xkattributeAnalyser();
		this.xkeAnalyser = new xkeAnalyser();
		this.xkeRender = new xkeRender(this);

		this.xksAnalyser = new xksAnalyser();
	}

	randomID(length){
	    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    var result = "";

	    for(var index = 0;index < length;index++) {
	        var randomIndex = Math.floor(Math.random() * chars.length);
	        result += chars.charAt(randomIndex);
	    }

	    return result;
	}

	//Elements

	setShortAttributes(names){
		for(var name of names){
			this.xkeAnalyser.xkaddShortAttribute(name);
		}
	}

	setShortItems(names){
		for(var name of names){
			this.xkeAnalyser.xkaddShortItem(name);
		}
	}

	//Styles

	setProperty(name,data){
		if(typeof(data) === "string"){
			this.xksAnalyser.xkaddTranspiledProperty(name,data);
		}else if(typeof(data) === "function"){
			this.xksAnalyser.xkaddProperty(name,data);
		}
	}

	//Containers

	setContainer(container){
		if(typeof(container) === "string"){
			this.container = document.querySelector(container);
		}else{
			this.container = container;
		}
	}

	getContainer(){
		return this.container;
	}

	//Views

	setView(name,elements){
		this.views[name] = elements;
	}

	hasView(name){
		return !(this.views[name] === undefined);
	}

	getView(name){
		if(this.hasView(name)){
			return this.views[name];
		}else{
			throw "This view do not exists";
		}
	}

	deleteView(name){
		if(this.hasView(name)){
			delete this.views[name];
		}else{
			throw "This view do not exists";
		}
	}

	setComponent(name,elements){
		this.components[name] = elements;
	}

	hasComponent(name){
		return !(this.components[name] === undefined);
	}

	getComponent(name){
		if(this.hasComponent(name)){
			return this.components[name];
		}else{
			throw "This component do not exists";
		}
	}

	deleteComponent(name){
		if(this.hasComponent(name)){
			delete this.components[name];
		}else{
			throw "This component do not exists";
		}
	}

	renderView(name){
		var self = this;

		if(this.hasView(name)){
			this.view = {
				name:name,
				type:"view",
				path:["root"],
				container:"root",
				items:[],
				item:this.getView(name),
				handle:this.getContainer(),
				queryAll:function(attribute,value){
					var returnedItems = [];

					function scan(subItems){
						for(var subItem of subItems){
							if(subItem.type === "component" || subItem.type === "element"){
								if(subItem.hasAttribute(attribute)){
									if(subItem.getAttribute(attribute) === value){
										returnedItems.push(subItem);
									}
								}

								if(subItem.items.length > 0){
									scan(subItem.items);
								}
							}
						}
					}

					scan(this.items);

					return returnedItems;
				},
				query:function(attribute,value){
					var returnedItem;

					function scan(subItems){
						for(var subItem of subItems){
							if(subItem.type === "component" || subItem.type === "element"){
								if(subItem.hasAttribute(attribute)){
									if(subItem.getAttribute(attribute) === value){
										returnedItem = subItem;
										break;
									}
								}

								if(subItem.items.length > 0){
									scan(subItem.items);
								}
							}
						}
					}

					scan(this.items);

					return returnedItem;
				},
				stylize:function(attribute,style){
					var items = this.queryAll("xklocal::category",attribute);

					items.forEach(function(item){
						var randomCategory = `item${randomID(10)}`;

						var buildedItems = self.xksAnalyser.xkshortcut(style(item));

						var styleString = "";

						for(var property of buildedItems){
							styleString += `${property.name}:${property.value};`;
						}

						item.handle.classList.add(randomCategory);

						var styleSheet = document.createElement("style");

						styleSheet.innerHTML = `.${randomCategory}{
							${styleString}
						}`;

						document.head.appendChild(styleSheet);
					})
				},
				render:function(elements,index){
					if(typeof(elements) === "string"){
						var analysedItems = self.xkeAnalyser.xkanalyse(elements);
					 	var buildedItems = self.xkeAnalyser.xkbuild(analysedItems);

					 	self.xkeRender.xkrender(this,this.handle,buildedItems,index === undefined ? null : index,false);
					}else{
						self.xkeRender.xkrender(this,this.handle,elements.items,index === undefined ? null : index,true);
					}
					if(this.item.update !== undefined){
						this.item.update();
					}
				},
				clone:function(){
					var clonedView = {
						name:"clone",
						type:"clone",
						items:[{
							name:this.name,type:"component",items:[],item:{}
						}]
					};

					for(var [dataName,dataValue] of Object.entries(this.item)){
						clonedView.items.item[dataName] = dataValue;
					} 

					function scan(container,items){
						for(var item of items){
							if(item.type === "component"){
								var clonedItem = {name:item.name,type:"component",items:[],item:{}};

								for(var [dataName,dataValue] of Object.entries(item.item)){
									clonedItem.item[dataName] = dataValue;
								}

								if(item.items.length > 0){
									scan(clonedItem,item.items);
								}

								container.items.push(clonedItem);
							}else if(item.type === "element"){
								var clonedItem = {name:item.name,type:"element",attributes:{},items:[],item:{}};

								for(var [attributeName,attributeValue] of Object.entries(item.attributes)){
									clonedItem.attributes[attributeName] = attributeValue;
								}

								for(var [dataName,dataValue] of Object.entries(item.item)){
									clonedItem.item[dataName] = dataValue;
								}

								if(item.items.length > 0){
									scan(clonedItem,item.items);
								}

								container.items.push(clonedItem);
							}else if(item.type === "text"){
								var clonedItem = {text:item.text,type:"text"};

								container.items.push(clonedItem);
							}
						}
					}

					scan(clonedView.items,this.items);

					return clonedView;
				},
				clear:function(){
					function scan(items){
						for(var item of items){
							item.delete();
						}
					}

					scan(this.items);
				},
				hasAttribute:function(name){
					return !(this.item.attributes[name] === undefined);
				},
				getAttribute:function(name){
					return this.item.attributes[name];
				},
				deleteAttribute:function(name){
					delete this.item.attributes[name];
				},
				setAttribute:function(name,value){
					this.item.attributes[name] = value;
				},
				toggleAttribute:function(name){
					var attributeValue = this.item.getAttribute(name);

					this.item.setAttribute(name,!attributeValue);
				},
				getScroll:function(){
					return{
						insertX:this.handle.scrollLeft,
						insertY:this.handle.scrollTop
					}
				},
				setScroll:function(x,y){
					this.handle.scrollLeft = x;
					this.handle.scrollTop = y;
				},
				getOffset:function(){
					var viewport = this.handle.getBoundingClientRect();

					return{
						scaleX:this.handle.offsetWidth,
						scaleY:this.handle.offsetHeight,
						scrollScaleX:this.handle.scrollWidth,
						scrollScaleY:this.handle.scrollHeight,
						insertX:this.handle.offsetLeft,
						insertY:this.handle.offsetTop,
						viewportInsertX:viewport.left,
						viewportInsertY:viewport.top
					}
				}
			}

			var viewItem = this.view;
			var viewItems = "";

			viewItem.item = new viewItem.item();

			viewItem.item.handle = viewItem;

			if(viewItem.item.initializePreRender !== undefined){
				viewItem.item.initializePreRender();
			}

			viewItems = viewItem.item.render();

			var analysedItems = this.xkeAnalyser.xkanalyse(viewItems);
			var buildedItems = this.xkeAnalyser.xkbuild(analysedItems);

			this.xkeRender.xkrender(viewItem,viewItem.handle,buildedItems,null,false);

			if(viewItem.item.initializePostRender !== undefined){
				viewItem.item.initializePostRender();
			}
			if(viewItem.item.update !== undefined){
				viewItem.item.update();
			}
		}else{
			throw "This view do not exists";
		}
	}
}