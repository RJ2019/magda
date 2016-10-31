import '../../node_modules/leaflet/dist/leaflet.css';
import Filter from './Filter';
import FilterHeader from './FilterHeader';
import getJsonp from '../helpers/getJsonp';
import defined from '../helpers/defined';
import getRegionTypes from '../dummyData/getRegionTypes';
import JurisdictionMap from './JurisdictionMap';
import JurisdictionPopup from './JurisdictionPopup';
import FilterSearchBox from './FilterSearchBox';
import React from 'react'
import getJSON from '../helpers/getJSON';


const regionTypeOptions = getRegionTypes();

/*
* the jurisdiction (location) facet filter, extends Filter class
*/
class FilterJurisdiction extends Filter {
    constructor(props) {
        super(props);
        this.openPopup = this.openPopup.bind(this);
        this.closePopUp = this.closePopUp.bind(this);
        this.onFeatureClick = this.onFeatureClick.bind(this);
        this.getLocationInfo = this.getLocationInfo.bind(this);
        this.searchLocation = this.searchLocation.bind(this);
        this.renderOption = this.renderOption.bind(this);

        /**
         * @type {object}
         * @property {boolean} popUpIsOpen whether the popup window that shows the bigger map is open or not
         * @property {string} searchText the search text when searching for a location
         * @property {array} locationSearchResults when searching for a location, the list of search results
         * @property {array} locationInfo the infomation for the location selected either by search or by clicking a region on the map
         * @property {array} activeRegionType activeRegionType == region type active jurisdiction || active region selected in popup map drop down, determines what vector tiles layer to display on map
         */
        this.state={
            popUpIsOpen: false,
            searchText: '',
            locationSearchResults: [],
            locationInfo: undefined,
            activeRegionType: regionTypeOptions[0],
        }
    }

    componentWillMount(){
        // url the url params to get teh full information about the active jurisdiction
        this.getLocationInfo();
    }

    /**
     * search for a jurisdiction
     * @param {string} searchText, the text user type in the input box inside the facet filter
     */
    searchLocation(text){
        getJsonp(`http://www.censusdata.abs.gov.au/census_services/search?query=${text || ' '}&cycle=2011&results=15&type=jsonp&cb=`).then(data=>{
            this.setState({
                locationSearchResults: data
            });
        }, error =>{console.log(error)});
    }

    openPopup(){
        this.setState({
            popUpIsOpen: true
        });
    }

    closePopUp(){
        this.setState({
            popUpIsOpen: false
        });
    }

    removeFilter(){
        this.props.updateQuery({
            jurisdictionId: [],
            jurisdictionType: []
        });

        this.setState({
            locationInfo: null,
        });
    }

    toggleOption(option, callback){
        this.props.updateQuery({
            jurisdictionId: option.suggestion.code,
            jurisdictionType: option.suggestion.type
        });

        this.setState({
            locationInfo: option.suggestion,
        });

        if(defined(callback) && typeof callback ==='function'){
          callback();
        }
    }

    /**
     * activate a jurisdiction option by clicking a region on the map
     * @param {string} regionCode, region code
     * @param {string} regionType, region type
     */
    onFeatureClick(regionId, regionType){
        this.props.updateQuery({
            jurisdictionId: regionId,
            jurisdictionType: regionType
        });
        this.getLocationInfo();
    }


    getLocationInfoInPlainText(){
        let result = this.state.locationInfo;
        let button = <button className='btn btn-reset' onClick={this.removeFilter}><i className='fa fa-times'/></button>;
        if(!result){
          return null;
        }
        if(result.geographyLabel){
          return (<div className='filter-jurisdiction--summray'><span>{result.geographyLabel}, {result.stateLabel}, {result.typeLabel}, {result.type}</span>{button}</div>);
        }
        if(result.displayFieldName){
          let propName = result.displayFieldName;
          return <div className='filter-jurisdiction--summray'><span>{result.attributes[propName]}</span>{button}</div>;
        }
        return null;
    }

    getLocationInfo(){
        let jurisdictionId = this.props.location.query.jurisdictionId;
        let jurisdictionType = this.props.location.query.jurisdictionType;
        if(jurisdictionId && jurisdictionType){
          // given jurisdictionId and jurisdictionType we should be able to get a location object
           getJSON(`https://nationalmap.gov.au/proxy/_0d/http://www.censusdata.abs.gov.au/arcgis/rest/services/FIND/MapServer/find?f=json&searchText=${jurisdictionId}&contains=false&returnGeometry=false&layers=${jurisdictionType}`).then(data=>{
             // results undefined
            if(data.results && data.results.length > 0 ){
              this.setState({
                  locationInfo: data.results[0]
              });
            }
          }, error =>{console.log(error)});
        }
    }

    selectRegionType(regionType){
      this.setState({
        activeRegionType: regionType
      })
    }

    // see Filter.renderOption(option, optionMax, callback, onFocus)
    // Here is only for mark up change
    renderOption(option, optionMax, callback, onFocus){
      let result = option.suggestion;
      if(!result){
        return null;
      }
      return (
            <button type='button'
                    ref={b=>{if(b != null && onFocus === true){b.focus()}}}
                    className='btn-facet-option btn btn-facet-option__location'
                    onClick={this.toggleOption.bind(this, option, callback)}
                    title={option.name}>
              <span className='btn-facet-option__name'>{result.geographyLabel} , {result.stateLabel}{option.matched && <span className='btn-facet-option__recomended-badge'>(recomended)</span>}</span>
              <span className='btn-facet-option__count'>100</span>
            </button>);
    }


    render(){
        return (
            <div className='filter jurisdiction'>
              <FilterHeader query={[this.props.location.query.jurisdictionId, this.props.location.query.jurisdictionType]}
                            removeFilter={this.removeFilter}
                            title={this.props.title}/>

              <FilterSearchBox allowMultiple={false}
                               searchFilter={this.searchLocation}
                               loadingProgress={this.state.loadingProgress}
                               renderOption={this.renderOption}
                               toggleOption={this.toggleOption}
                               options={this.state.locationSearchResults}/>

                {this.getLocationInfoInPlainText()}

              <div className='preview'>
                    <JurisdictionMap title='jurisdiction'
                                     id='jurisdiction'
                                     location={this.props.location}
                                     updateQuery={this.props.updateQuery}
                                     onClick={this.openPopup}
                                     interaction={false}
                                     locationInfo={this.state.locationInfo}
                    />
              </div>

              {this.state.popUpIsOpen && <JurisdictionPopup locationSearchResults={this.state.locationSearchResults}
                                                            updateQuery={this.props.updateQuery}
                                                            onFeatureClick={this.props.onFeatureClick}
                                                            locationInfo={this.state.locationInfo}
                                                            locationInfoSummray={this.getLocationInfoInPlainText()}
                                                            location={this.props.location}
                                                            closePopUp={this.closePopUp}
                                                            toggleOption={this.toggleOption}
                                                            searchLocation={this.searchLocation}
                                                            loadingProgress={this.state.loadingProgress}
                                                            renderOption={this.renderOption}
                                                            />}

            </div>
      );
    }
}

export default FilterJurisdiction;
