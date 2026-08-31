"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ArticleGraphNode = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  contentLength: number;
};

export type ArticleGraphEdge = {
  kind: "page-link";
};

export type ArticleGraphData = {
  nodes: ArticleGraphNode[];
  edges: Array<
    ArticleGraphEdge & { id: string; source: string; target: string }
  >;
};

type PositionedNode = ArticleGraphNode &
  SimulationNodeDatum & {
    radius: number;
  };

type PositionedEdge = ArticleGraphEdge &
  SimulationLinkDatum<PositionedNode> & {
    id: string;
  };

type Dimensions = { width: number; height: number };
type Point = { x: number; y: number };

function stringHash(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}

function getTopicCenters(topics: string[], dimensions: Dimensions) {
  const centers = new Map<string, Point>();
  const center = { x: dimensions.width / 2, y: dimensions.height / 2 };

  if (topics.length <= 1) {
    centers.set(topics[0] ?? "untagged", center);
    return centers;
  }

  const radiusX = Math.min(dimensions.width * 0.34, 260);
  const radiusY = Math.min(dimensions.height * 0.29, 115);

  topics.forEach((topic, index) => {
    const angle = -Math.PI / 2 + (index / topics.length) * Math.PI * 2;
    centers.set(topic, {
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY,
    });
  });

  return centers;
}

function getNodeTarget(
  node: ArticleGraphNode,
  topicCenters: Map<string, Point>,
  dimensions: Dimensions,
) {
  const centers = (node.tags.length ? node.tags : ["untagged"])
    .map((tag) => topicCenters.get(tag))
    .filter((center): center is Point => Boolean(center));

  if (!centers.length) {
    return { x: dimensions.width / 2, y: dimensions.height / 2 };
  }

  return {
    x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
    y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length,
  };
}

function getNodeRadius(length: number, min: number, max: number) {
  if (min === max) return 7;
  const normalized = Math.sqrt((length - min) / (max - min));
  return 4 + normalized * 6;
}

function keepNodesInBounds(nodes: PositionedNode[], dimensions: Dimensions) {
  const padding = 2;

  for (const node of nodes) {
    const minX = node.radius + padding;
    const maxX = Math.max(minX, dimensions.width - node.radius - padding);
    const minY = node.radius + padding;
    const maxY = Math.max(minY, dimensions.height - node.radius - padding);

    node.x = Math.min(maxX, Math.max(minX, node.x ?? minX));
    node.y = Math.min(maxY, Math.max(minY, node.y ?? minY));
  }
}

export function ArticleGraph({
  className,
  data,
}: {
  className?: string;
  data: ArticleGraphData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const simulationRef = useRef<Simulation<
    PositionedNode,
    PositionedEdge
  > | null>(null);
  const nodesRef = useRef<PositionedNode[]>([]);
  const linksRef = useRef<PositionedEdge[]>([]);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 720,
    height: 420,
  });
  const [, renderTick] = useState(0);

  const topics = useMemo(() => {
    const tags = new Set(data.nodes.flatMap((node) => node.tags));
    if (data.nodes.some((node) => node.tags.length === 0)) tags.add("untagged");
    return [...tags].sort();
  }, [data.nodes]);

  const topicCenters = useMemo(
    () => getTopicCenters(topics, dimensions),
    [dimensions, topics],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: Math.max(container.clientWidth, 280),
        height: Math.max(container.clientHeight, 160),
      });
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const lengths = data.nodes.map((node) => node.contentLength);
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    const nodes = data.nodes.map<PositionedNode>((node) => {
      const target = getNodeTarget(node, topicCenters, dimensions);
      const hash = stringHash(node.id);
      const angle = (hash % 360) * (Math.PI / 180);
      const jitter = 12 + (hash % 24);

      return {
        ...node,
        radius: getNodeRadius(node.contentLength, minLength, maxLength),
        x: target.x + Math.cos(angle) * jitter,
        y: target.y + Math.sin(angle) * jitter,
      };
    });
    const links = data.edges.map<PositionedEdge>((edge) => ({ ...edge }));
    const simulation = forceSimulation<PositionedNode>(nodes)
      .force(
        "link",
        forceLink<PositionedNode, PositionedEdge>(links)
          .id((node) => node.id)
          .distance(76)
          .strength(0.65),
      )
      .force("charge", forceManyBody().strength(-125))
      .force(
        "collide",
        forceCollide<PositionedNode>().radius((node) => node.radius + 7),
      )
      .force(
        "topic-x",
        forceX<PositionedNode>(
          (node) => getNodeTarget(node, topicCenters, dimensions).x,
        ).strength(0.16),
      )
      .force(
        "topic-y",
        forceY<PositionedNode>(
          (node) => getNodeTarget(node, topicCenters, dimensions).y,
        ).strength(0.16),
      )
      .alphaDecay(0.035);

    nodesRef.current = nodes;
    linksRef.current = links;
    simulationRef.current = simulation;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      simulation.stop();
      for (let index = 0; index < 180; index += 1) simulation.tick();
      keepNodesInBounds(nodes, dimensions);
      renderTick((tick) => tick + 1);
    } else {
      simulation.on("tick", () => {
        keepNodesInBounds(nodes, dimensions);
        renderTick((tick) => tick + 1);
      });
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, topicCenters]);

  function moveNode(event: ReactPointerEvent<Element>, node: PositionedNode) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    node.fx = Math.min(
      dimensions.width - node.radius - 2,
      Math.max(node.radius + 2, event.clientX - bounds.left),
    );
    node.fy = Math.min(
      dimensions.height - node.radius - 2,
      Math.max(node.radius + 2, event.clientY - bounds.top),
    );
  }

  function releaseNode(
    event: ReactPointerEvent<Element>,
    node: PositionedNode,
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    node.fx = null;
    node.fy = null;
    simulationRef.current?.alphaTarget(0);
  }

  if (!data.nodes.length) return null;

  return (
    <section aria-label="Article map" className={className}>
      <div className="relative h-full overflow-hidden" ref={containerRef}>
        <svg
          aria-label="Force-directed map of articles grouped by topic"
          className="block size-full touch-none"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <g stroke="var(--muted-foreground)">
            {linksRef.current.map((edge) => {
              const source = edge.source as PositionedNode;
              const target = edge.target as PositionedNode;

              return (
                <line
                  key={edge.id}
                  opacity="0.27"
                  strokeWidth="1.5"
                  x1={source.x}
                  x2={target.x}
                  y1={source.y}
                  y2={target.y}
                />
              );
            })}
          </g>

          <g>
            {nodesRef.current.map((node) => (
              <Tooltip key={node.id}>
                <TooltipTrigger
                  render={
                    <a
                      aria-label={`${node.title}. ${node.tags.length ? `Topics: ${node.tags.join(", ")}.` : "No topic."}`}
                      href={`/articles/${node.slug}`}
                      onClick={(event) => {
                        if (
                          dragRef.current?.id === node.id &&
                          dragRef.current.moved
                        ) {
                          event.preventDefault();
                        }
                        dragRef.current = null;
                      }}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragRef.current = {
                          id: node.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          moved: false,
                        };
                        node.fx = node.x;
                        node.fy = node.y;
                        simulationRef.current?.alphaTarget(0.22).restart();
                      }}
                      onPointerMove={(event) => {
                        if (
                          dragRef.current?.id === node.id &&
                          Math.hypot(
                            event.clientX - dragRef.current.startX,
                            event.clientY - dragRef.current.startY,
                          ) > 3
                        ) {
                          dragRef.current.moved = true;
                        }
                        moveNode(event, node);
                      }}
                      onPointerUp={(event) => releaseNode(event, node)}
                    >
                      <g transform={`translate(${node.x ?? 0} ${node.y ?? 0})`}>
                        <circle
                          fill="var(--foreground)"
                          className="hover:fill-primary"
                          r={node.radius}
                          stroke="var(--background)"
                          strokeWidth="2"
                        />
                      </g>
                    </a>
                  }
                />
                <TooltipContent className="text-center">
                  {node.title}
                </TooltipContent>
              </Tooltip>
            ))}
          </g>
        </svg>
      </div>
    </section>
  );
}
