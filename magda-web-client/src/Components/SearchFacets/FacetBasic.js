import React, { Component } from 'react';
import FacetHeader from './FacetHeader';
import find from 'lodash.find';
import maxBy from 'lodash.maxby';
import defined from '../../helpers/defined';
import FacetSearchBox from './FacetSearchBox';
import {config} from '../../config' ;
import ToggleList from '../../UI/ToggleList';
import Button from 'muicss/lib/react/button';

// extends Facet class
class FacetBasic extends Component {
  constructor(props) {
    super(props);
    this.renderOption=this.renderOption.bind(this);
  }
/**
 * check is this option can be found in the list of activeOptions
 * @param {object} option the current option to render
 */
  checkActiveOption(option){
    return find(this.props.activeOptions, o=> o.value.toLowerCase() === option.value.toLowerCase());
  }

/**
 * generate the html for a option of this filter
 * @param {object} option the current option to render
 * @param {object} optionMax the option with the max value of object.value, this is uased to calculate the width of the volumne indicator
 * @param {function} onClick when clicked
 * @param {boolean} onFocus whether this option should be in focus or not
 */
  renderOption(option, onClick, optionMax, onFocus){
    if(!option){
      return null;
    }
    let maxWidth = defined(optionMax) ? +option.hitCount/optionMax.hitCount * 200 : 0;
    let divStyle = {width: maxWidth + 'px', height: '3px', background: "#F55860"}
    let isActive = this.checkActiveOption(option);

    return(
    <Button key={option.value}
            type='button'
            className={`${isActive ? 'is-active' : ''} btn-facet-option`}
            onClick={onClick.bind(this, option)}
            title={option.value}>
      <span style={divStyle} className='btn-facet-option__volume-indicator'/>
      <span className='btn-facet-option__name'>
        {option.value}{' '}({option.hitCount})
      </span>
    </Button>);
  }

  onApplyFilter(){
    this.props.onToggleOption();
  }

  renderBox(){
    let that = this;
    let defaultSize = config.facetListSize;
    // default list of options to display for the facet filter except those already active, which will be displayed in a seperate list
    let inactiveOptions = this.props.options.filter(o=>!this.checkActiveOption(o));
    // the option that has the max object.value value, use to calculate volumne indicator
    let maxOptionOptionList = maxBy(this.props.options, o=> +o.hitCount);
    return (<div className={'facet-body ' + this.props.title}>
              <div className='clearfix facet-body__header'>
                <FacetSearchBox renderOption={this.renderOption}
                                options={this.props.facetSearchResults}
                                onToggleOption={this.props.onToggleOption}
                                searchFacet={this.props.searchFacet}
                                />
              </div>
               <ul className='mui-list--unstyled'>
                 {that.props.activeOptions.sort((a, b)=>b.hitCount - a.hitCount).map(o=><li key={`${o.value}-${o.hitCount}`}>{that.renderOption(o, this.props.onToggleOption, maxOptionOptionList)}</li>)}
                 {this.props.options.length === 0 && <li className='no-data'>No {this.props.id}</li>}
               </ul>
              {inactiveOptions.map(o => this.renderOption(o, this.props.onToggleOption, maxOptionOptionList))}
              <div className='facet-footer'>
                  <Button variant="flat" onClick={this.props.onResetFacet}> Clear </Button>
                  <Button variant="flat" onClick={this.onApplyFilter}> Apply </Button>
              </div>
            </div>)
  }

  render(){
    return <div className='facet-wrapper'>
              <FacetHeader
                     isOpen = {this.props.isOpen}
                     title={this.props.title}
                     activeOptions={this.props.activeOptions}
                     hasQuery={this.props.hasQuery}
                     onClick={this.props.toggleFacet}/>
                {this.props.isOpen && this.renderBox()}
           </div>
  }
}

export default FacetBasic;
