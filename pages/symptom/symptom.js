 //index.js
// import { symptomListFetch} from '../../common/fetch';
import { symptomSearchFetch, statistics } from '../../common/fetch';
//获取应用实例
var app = getApp()
Page({
    data: {
        allList:{},
        list: [],
        sort: [],
        currentSortIdx: 0,
        selected: [],
        hasSel:  false,

        // cartMask: false,

        searchList: [],
        searchValue: '',
        isShowCar:false,
        tipFlag:false
    },
    
    onLoad() {
        let {symptomList, symptomCategory} = app.globalData,
            currentSort = symptomCategory[0];
        
        this.setData({
            allList: symptomList,
            list: symptomList[currentSort],
            sort: symptomCategory
        })
        //navigateBack携带参数 by zqy 回到上一页，在data里定义changeItem，然后在onshow里
        let pages = getCurrentPages();//当前页面
        let prevPage = pages[pages.length - 2];//上一页面
        prevPage.setData({//直接给上移页面赋值
          changeItem:'yes'
        });

    },    
    // 选择分类
    clickSortList(e) {
        let idx = e.currentTarget.dataset.idx,
            {sort, selected} = this.data,
            {symptomList} = app.globalData,
            _list = JSON.parse(JSON.stringify(symptomList[sort[idx]]));

        for (let i = 0; i < selected.length; i++) {
            for (let j = 0; j < _list.length; j++) {
                if (selected[i].id == _list[j].id) {
                    _list[j].choice = true;
                }
            }
        }

        this.setData({
            currentSortIdx: idx,
            list: _list
        })
    },

    // 选择症状
    clickTag: function (e) {
        this.setData({
          tipFlag:true
        })
        let id = e.currentTarget.dataset.id;
        let {list, selected} = this.data;

        let _tag = JSON.parse(JSON.stringify(list)),
            _selected = JSON.parse(JSON.stringify(selected));

        for (let i = 0; i < _tag.length; i++) {
            if (_tag[i].id == id) {
                if (_tag[i].choice) {
                    _tag[i].choice = false;
                    for (let j = 0; j < _selected.length; j++) {
                        if (_selected[j].id == id) {
                            _selected.splice(j, 1);
                        }
                    }
                } else {
                    _tag[i].choice = true;
                    _selected.push(_tag[i]);
                }
            }
        }
        this.setData({
            list: _tag,
            selected: _selected,
            hasSel: _selected.length > 0 ? true : false
        })
    },

    // cart中删除已选项
    deleteChoice: function (e) {
        let {selected, list} = this.data;
        let idx = e.currentTarget.dataset.idx;

        let _selected = JSON.parse(JSON.stringify(selected));
        let _tag = JSON.parse(JSON.stringify(list));

        for (let i = 0; i < _tag.length; i++) {
            if (_tag[i].id == _selected[idx].id) {
                _tag[i].choice = false;
            }
        }

        _selected.splice(idx, 1);

        if (_selected.length == 0) {
            // this.clickCartMask()
          this.setData({
            isShowCar:false
          })
        }

        this.setData({
            selected: _selected,
            hasSel: _selected.length > 0 ? true : false,
            list: _tag
        })

    },
    //zqy 点击购物车出现遮罩层和症状列表
    showMaskSymptomList(){
      let { selected, list } = this.data,
        _selected = JSON.parse(JSON.stringify(selected));
      if (_selected.length > 0){
        this.setData({
          isShowCar: true
        })
      }
     
    },
    hideMask(){
      this.setData({
        isShowCar: false
      })
    },
    // 确定
    sure: function () {
        // app.setReqlabItems([]);
        // app.setReqPastDiseases([]);
        // app.setReqSymptoms([]);

        let {selected} = this.data,
            symptoms = [],
            str='',

            { inquiryDataList}=app.globalData,
            len = inquiryDataList.length;

        if (selected.length == 0) {
            wx.showModal({
                content: '请选择症状表现',
                showCancel: false,
                confirmText: '知道了',
                confirmColor: '#41B8B0'
            })
            return;
        }

        selected.map(function (val, idx) {
            symptoms.push(val.id);
            str+=val.text;
            if(idx<selected.length-1){
                str+=', '
            }
        })
        
        app.setSelectedSymptom(symptoms);

        inquiryDataList[len-1].answer.push({
            type:'text',
            value:str
        });

        app.setInquiryDataList(inquiryDataList)

        try{
            statistics({
                options: [
                    '$event=click_symptom_submit', '$app=wx-app-doctor'
                ],
                sessionId: app.globalData.sessionId
            })
        }catch(e){console.log(e)}
        
        wx.reLaunch({
            url: '/pages/inquiry/inquiry?source=symptom',
        })

    },

    // search部分
    searchChange(e) {
        let self = this;
        let {value} = e.detail;

        this.setData({
            searchValue: value
        })

        if (value == "") {
            this.setData({
                searchList: []
            })
            return;
        }
        self.searchFetch(value);
    },
    searchFetch: function (value) {
        let self = this;
        let params = {
            text: value,
            type: 'search',
            age: app.globalData.userAge,
            gender: app.globalData.userInfo.userInfo.gender == 1 ? 'GenderMale' :'GenderFemale',
            sessionId: app.globalData.sessionId,
            cb: self.searchSuccess
        }
        // symptomListFetch(params)
        symptomSearchFetch(params)
    },

    searchSuccess: function (data) {
        if(JSON.stringify(data)=="{}" || data.items.length==0){
            this.setData({
                searchList: []
            })
            return;
        }
        this.setData({
            searchList: data.items
        })
    },
    clickSearckList: function (e) {
        let {id, name} = e.currentTarget.dataset;
        let json = {
            id: id,
            text: name,
            choice: true,
            attrs: {}
        }

        let {selected, list} = this.data;
        let _selected = JSON.parse(JSON.stringify(selected)),
            _list = JSON.parse(JSON.stringify(list));

        for (let i = 0; i < _selected.length; i++) {
            if (_selected[i].id == id) {
                return;
            }
        }
        for (let i = 0; i < _list.length; i++) {
            if (_list[i].id == id) {
                _list[i].choice=true
            }
        }
        _selected.push(json);

        this.setData({
            selected: _selected,
            hasSel: _selected.length > 0 ? true : false,
            searchList: [],
            searchValue: '',
            list:_list
        })

    },

    clickSearchMask(){
        this.setData({
            searchValue:''
        })
    },

    //分享
    onShareAppMessage: function () {
        return {
            title: '大数健康测评',
            path: "pages/inquiry/inquiry"
        }
    }

})
