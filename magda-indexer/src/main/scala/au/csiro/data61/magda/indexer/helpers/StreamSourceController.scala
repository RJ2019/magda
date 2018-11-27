package au.csiro.data61.magda.indexer.helpers

import java.util.concurrent.atomic.AtomicLong

import akka.NotUsed
import akka.actor.{ActorRef, ActorSystem, Scheduler}
import akka.event.Logging
import akka.stream._
import akka.stream.impl.Stages.DefaultAttributes
import akka.stream.impl.fusing.GraphStages.SimpleLinearGraphStage
import akka.stream.scaladsl.{Keep, Sink, Source}
import akka.stream.stage.{GraphStageLogic, InHandler, OutHandler}
import au.csiro.data61.magda.model.misc.DataSet
import com.typesafe.config.Config
import org.reactivestreams.Publisher

import scala.concurrent.ExecutionContextExecutor

/**
  * This class creates a stream source of type Source[DataSet, NotUsed]. The source can be filled
  * with DataSet object any time after the creation.
  *
  * The class can also controls the life cycle of the related stream when the argument
  * @param streamController 
  *
  * @param bufferSize the maximal number of datasets to fill the stream source
  * @param streamController control the data registry crawling
  * @param system akka actor system
  * @param config akka config
  * @param materializer akka materializer
  */
class StreamSourceController(bufferSize: Int, streamController: StreamController)
                            (implicit val system: ActorSystem,
                             implicit val config: Config,
                             implicit val materializer: Materializer) {

  val log = Logging(system, getClass)
  implicit val ec: ExecutionContextExecutor = system.dispatcher
  implicit val scheduler: Scheduler = system.scheduler

  private val GET_MORE_DATASETS: String = "Get more datasets"
  private val NO_MORE_DATASETS: String = "No more datasets"
  private val dataSetCount = new AtomicLong(0)
  private val (ref, source) = createStreamSource()

  /**
    *
    * @tparam Object
    */
  final case class MessageChecker[Object]() extends SimpleLinearGraphStage[Object] {
    override def initialAttributes: Attributes = DefaultAttributes.take

    override def createLogic(inheritedAttributes: Attributes): GraphStageLogic =
      new GraphStageLogic(shape) with InHandler with OutHandler {
        override def onPush(): Unit = {
          val message = grab(in)
          if (message == NO_MORE_DATASETS)
            completeStage()
          else if (message == GET_MORE_DATASETS) {
            if (streamController != None.orNull)
              streamController.next(bufferSize / 2)

            pull(in)
          }
          else
            push(out, message)
        }

        override def onPull(): Unit = {
          pull(in)
        }

       setHandlers(in, out, this)
      }

    override def toString: String = "MessageChecker"
  }

  private def createStreamSource(): (ActorRef, Source[DataSet, NotUsed]) = {
    // The additional 2 slots in the buffer are for the the control messages GET_MORE_DATASETS
    // and NO_MORE_DATASETS.
    val (ref: ActorRef, publisher: Publisher[DataSet]) =
      Source.actorRef[DataSet](bufferSize = bufferSize + 2, OverflowStrategy.fail)
        .toMat(Sink.asPublisher(true))(Keep.both).run()

    val source: Source[DataSet, NotUsed] = Source.fromPublisher(publisher)
    val source2: Source[DataSet, NotUsed] = source.via(MessageChecker.apply())
    (ref, source2)
  }

  def fillSource(dataSets: Seq[DataSet], hasNext: Boolean, isFirst: Boolean): Unit = {
    if (isFirst){
      dataSets foreach (dataSet => {
        dataSet.copy(publisher = dataSet.publisher)
        ref ! dataSet
        if (dataSetCount.incrementAndGet() == bufferSize / 2)
          ref ! GET_MORE_DATASETS
      })
    }
    else {
      dataSets foreach (dataSet => {
        dataSet.copy(publisher = dataSet.publisher)
        ref ! dataSet
        if (dataSetCount.incrementAndGet() % (bufferSize / 2) == 0)
          ref ! GET_MORE_DATASETS
      })
    }

    if (!hasNext)
      ref ! NO_MORE_DATASETS
  }

  def refAndSource: (ActorRef, Source[DataSet, NotUsed]) = {
    (ref, source)
  }
}
