package au.csiro.data61.magda.model

import java.time.Duration
import java.time.Instant
import spray.json._
import au.csiro.data61.magda.model.temporal._

package misc {
  case class SearchResult(
    hitCount: Int,
    facets: Option[Seq[Facet]] = None,
    dataSets: List[DataSet])

  case class FacetType(id: String)
  case object FacetType {
    val Publisher = FacetType("publisher")
    val Year = FacetType("year")

    val all = Seq(Publisher, Year)

    private val idToFacet = all.groupBy(_.id).mapValues(_.head)

    def fromId(id: String): Option[FacetType] = idToFacet get id
  }

  case class FacetSearchResult(
    hitCount: Int,
    options: Seq[FacetOption])

  case class Facet(
    id: FacetType,
    options: Seq[FacetOption])

  case class FacetOption(
    value: String,
    hitCount: Option[Int] = None)

  case class DataSet(
      identifier: String,
      catalog: String,
      title: Option[String] = None,
      description: Option[String] = None,
      issued: Option[Instant] = None,
      modified: Option[Instant] = None,
      language: Option[String] = None,
      publisher: Option[Agent] = None,
      accrualPeriodicity: Option[Periodicity] = None,
      spatial: Option[Location] = None,
      temporal: Option[PeriodOfTime] = None,
      theme: Seq[String] = List(),
      keyword: Seq[String] = List(),
      contactPoint: Option[Agent] = None,
      distribution: Option[Seq[Distribution]] = None,
      landingPage: Option[String] = None) {

    def uniqueId: String = java.net.URLEncoder.encode(catalog + "/" + identifier, "UTF-8")
  }

  case class Agent(
    name: Option[String] = None,
    homePage: Option[String] = None,
    email: Option[String] = None,
    extraFields: Map[String, String] = Map())

  case class Location(
    name: Option[String] = None,
    // This is supposed to be able to define shapes and stuff too, god knows how to do that yet...
    latLong: Option[LatLong] = None)

  case class LatLong(latitude: Double, longitude: Double)

  case class Distribution(
    title: String,
    description: Option[String] = None,
    issued: Option[Instant] = None,
    modified: Option[Instant] = None,
    license: Option[License] = None,
    rights: Option[License] = None,
    accessURL: Option[String] = None,
    downloadURL: Option[String] = None,
    byteSize: Option[Int] = None,
    mediaType: Option[String] = None,
    format: Option[String] = None)

  case class License(name: String, url: String)

  trait Protocols extends DefaultJsonProtocol with temporal.Protocols {
    implicit val licenseFormat = jsonFormat2(License.apply)
    implicit object FacetTypeFormat extends JsonFormat[FacetType] {
      override def write(facetType: FacetType): JsString = JsString.apply(facetType.id)
      override def read(json: JsValue): FacetType = FacetType.fromId(json.convertTo[String]).get
    }
    implicit val distributionFormat = jsonFormat11(Distribution.apply)
    implicit val latLngFormat = jsonFormat2(LatLong.apply)
    implicit val locationFormat = jsonFormat2(Location.apply)
    implicit val agentFormat = jsonFormat4(Agent.apply)
    implicit val dataSetFormat = jsonFormat16(DataSet.apply)
    implicit val facetOptionFormat = jsonFormat2(FacetOption.apply)
    implicit val facetFormat = jsonFormat2(Facet.apply)
    implicit val searchResultFormat = jsonFormat3(SearchResult.apply)
    implicit val facetSearchResultFormat = jsonFormat2(FacetSearchResult.apply)
  }

  object Protocols extends Protocols {

  }
}