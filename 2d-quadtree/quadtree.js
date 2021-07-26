/**
*四叉树构造函数
*@类四叉树
*@param{Rect}节点的边界（{x，y，width，height}）
*@param{number}[max\u objects=10]（可选）在拆分为4个子节点之前，节点可以容纳的最大对象数（默认值：10）
*@param{number}[max\u levels=4]（可选）根四叉树内的总最大级别（默认值：4）
*@param{number}[level=0]（可选）深度级别，子节点需要（默认值：0）
*/
function Quadtree(bounds, max_objects, max_levels, level) {
    
    // this.max_objects    = max_objects || 10;
    this.max_objects    = 4;
    this.max_levels     = max_levels || 4;
    
    this.level  = level || 0;
    this.bounds = bounds;
    
    this.objects    = [];
    this.nodes      = [];
};

/**
 * 将节点拆分为4个子节点
 * @memberof Quadtree
 */
Quadtree.prototype.split = function() {
    
    var nextLevel   = this.level + 1,
        subWidth    = this.bounds.width/2,
        subHeight   = this.bounds.height/2,
        x           = this.bounds.x,
        y           = this.bounds.y;        
 
    //top right node
    this.nodes[0] = new Quadtree({
        x       : x + subWidth, 
        y       : y, 
        width   : subWidth, 
        height  : subHeight
    }, this.max_objects, this.max_levels, nextLevel);
    
    //top left node
    this.nodes[1] = new Quadtree({
        x       : x, 
        y       : y, 
        width   : subWidth, 
        height  : subHeight
    }, this.max_objects, this.max_levels, nextLevel);
    
    //bottom left node
    this.nodes[2] = new Quadtree({
        x       : x, 
        y       : y + subHeight, 
        width   : subWidth, 
        height  : subHeight
    }, this.max_objects, this.max_levels, nextLevel);
    
    //bottom right node
    this.nodes[3] = new Quadtree({
        x       : x + subWidth, 
        y       : y + subHeight, 
        width   : subWidth, 
        height  : subHeight
    }, this.max_objects, this.max_levels, nextLevel);
};


/**
*确定对象属于哪个节点
*@param{Rect}要检查的区域的pRect边界（{x，y，width，height}）
*@return{number[]}相交子节点的索引数组（0-3=右上、左上、左下、右下）
*@memberof四叉树
*/
Quadtree.prototype.getIndex = function(pRect) {
    
    var indexes = [],
        verticalMidpoint    = this.bounds.x + (this.bounds.width/2), // x中心
        horizontalMidpoint  = this.bounds.y + (this.bounds.height/2);     // y中心

    var startIsNorth = pRect.y < horizontalMidpoint,
        startIsWest  = pRect.x < verticalMidpoint, 
        endIsEast    = pRect.x + pRect.width > verticalMidpoint,
        endIsSouth   = pRect.y + pRect.height > horizontalMidpoint;    

    //top-right quad
    if(startIsNorth && endIsEast) {
        indexes.push(0);
    }
    
    //top-left quad
    if(startIsWest && startIsNorth) {
        indexes.push(1);
    }

    //bottom-left quad
    if(startIsWest && endIsSouth) {
        indexes.push(2);
    }

    //bottom-right quad
    if(endIsEast && endIsSouth) {
        indexes.push(3);
    }
    return indexes;
};


/*
*将对象插入节点。如果节点
*超过容量时，将拆分并添加所有
*对象到其相应的子节点。
*@param{Rect}要添加的对象的pRect边界（{x，y，width，height}）
*@memberof四叉树
*/
Quadtree.prototype.insert = function(pRect) {
    
    var i = 0,
        indexes;
     
    //如果存在子节点,那么找到子节点像子节点添加数据(子节点就是子树)
    if(this.nodes.length) {
        indexes = this.getIndex(pRect);
 
        for(i=0; i<indexes.length; i++) {
            this.nodes[indexes[i]].insert(pRect);     
        }
        return;
    }
 
    //如果没找到不存在nodes 向objects添加
    this.objects.push(pRect);

    // 如果objects超出最大max_objects 那么就拆分
    // 开始
    if(this.objects.length > this.max_objects && this.level < this.max_levels) {

        //拆分子节点 (split方法可以移步仓库看代码,很简单。后续不贴了)
        if(!this.nodes.length) {
            this.split();
        }
        
        //将所有objects添加到对应的nodes 
        for(i=0; i<this.objects.length; i++) { 
            indexes = this.getIndex(this.objects[i]); //找到对应的nodes
            for(var k=0; k<indexes.length; k++) {
                this.nodes[indexes[k]].insert(this.objects[i]);
            }
        }

        //清空这个objects
        this.objects = [];
        // 超出max_objects逻辑结束
    }
 };
 
 
/**
*返回所有可能与给定对象碰撞的对象
*@param{Rect}要检查的对象的pRect边界（{x，y，width，height}）
*@return{Rect[]}数组，包含所有检测到的对象
*@memberof四叉树
*/
Quadtree.prototype.retrieve = function(pRect) {
    var indexes = this.getIndex(pRect),
        returnObjects = this.objects;
        
    //如果有nodes，检索它们的objects
    if(this.nodes.length) {
        for(var i=0; i<indexes.length; i++) {
            returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(pRect));
        }
    }

    //去重
    returnObjects = returnObjects.filter(function(item, index) {
        return returnObjects.indexOf(item) >= index;
    });
    return returnObjects;
};


/**
 * 清除四叉树
 * @memberof Quadtree
 */
Quadtree.prototype.clear = function() {
    
    this.objects = [];
 
    for(var i=0; i < this.nodes.length; i++) {
        if(this.nodes.length) {
            this.nodes[i].clear();
          }
    }

    this.nodes = [];
};

