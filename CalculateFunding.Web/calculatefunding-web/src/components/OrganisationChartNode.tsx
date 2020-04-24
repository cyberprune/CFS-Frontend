import React, { useState, useRef, useEffect } from "react";
import { getDragInfo, sendDragInfo, clearDragInfo, sendSelectedNodeInfo, getSelectedNodeInfo } from "../services/templateBuilderService";
import "../styles/OrganisationChartNode.scss";
import { FundingLineOrCalculation, FundingLine, Calculation, FundingLineOrCalculationSelectedItem, NodeType } from "../types/TemplateBuilderDefinitions";

interface OrganisationChartNodeProps {
  id?: string,
  datasource: FundingLineOrCalculation,
  NodeTemplate: React.ReactType,
  draggable?: boolean,
  collapsible?: boolean,
  multipleSelect?: boolean,
  changeHierarchy: (draggedItemData: FundingLineOrCalculation, draggedItemDsKey: number, dropTargetId: string, dropTargetDsKey: number) => Promise<void>,
  cloneNode: (draggedItemData: FundingLineOrCalculation, draggedItemDsKey: number, dropTargetId: string, dropTargetDsKey: number) => Promise<void>,
  onClickNode: (node: FundingLineOrCalculationSelectedItem) => void,
  addNode: (id: string, newChild: FundingLine | Calculation) => Promise<void>,
  openSideBar: (open: boolean) => void,
  editMode: boolean,
  nextId: number,
  dsKey: number,
};

const defaultProps = {
  draggable: false,
  collapsible: true,
  multipleSelect: false
};

function OrganisationChartNode({
  datasource,
  NodeTemplate,
  draggable,
  collapsible,
  multipleSelect,
  changeHierarchy,
  cloneNode,
  onClickNode,
  addNode,
  openSideBar,
  editMode,
  nextId,
  dsKey,
}: OrganisationChartNodeProps) {
  const node = useRef<HTMLDivElement>(null);

  const [isChildrenCollapsed, setIsChildrenCollapsed] = useState<boolean>(false);
  const [topEdgeExpanded, setTopEdgeExpanded] = useState<boolean>();
  const [rightEdgeExpanded, setRightEdgeExpanded] = useState<boolean>();
  const [bottomEdgeExpanded, setBottomEdgeExpanded] = useState<boolean>();
  const [leftEdgeExpanded, setLeftEdgeExpanded] = useState<boolean>();
  const [allowedDrop, setAllowedDrop] = useState<boolean>(false);
  const [selected, setSelected] = useState<boolean>(false);

  const nodeClass = [
    "oc-node",
    isChildrenCollapsed ? "isChildrenCollapsed" : "",
    allowedDrop ? "allowedDrop" : "",
    selected ? "selected" : ""
  ]
    .filter(item => item)
    .join(" ");

  function permissible(sourceNodeKind: NodeType, targetNodeKind: NodeType): boolean {
    if (sourceNodeKind === NodeType.Calculation) {
      return true;
    }

    return targetNodeKind === NodeType.FundingLine;
  }

  useEffect(() => {
    const subs1 = getDragInfo().subscribe(draggedInfo => {
      if (draggedInfo && draggedInfo.draggedNodeId && draggedInfo.draggedNodeKind && node && node.current) {
        const draggedNode = document.querySelector("[id='" + draggedInfo.draggedNodeId + "']");
        if (draggedNode) {
          const closestNode = draggedNode.closest("li");
          if (closestNode) {
            const dropTargetNodeKind: NodeType = node.current.getAttribute('data-kind') as NodeType;
            const currentNode = closestNode.querySelector("[id='" + node.current.id + "']");
            setAllowedDrop(
              !currentNode && permissible(draggedInfo.draggedNodeKind, dropTargetNodeKind)
                ? true
                : false
            );
          }
        }

      } else {
        setAllowedDrop(false);
      }
    });

    const subs2 = getSelectedNodeInfo()
      .subscribe(selectedNodeInfo => {
        if (selectedNodeInfo) {
          if (multipleSelect) {
            if (selectedNodeInfo.selectedNodeId === datasource.id) {
              setSelected(true);
            }
          } else {
            setSelected(selectedNodeInfo.selectedNodeId === datasource.id);
          }
        } else {
          setSelected(false);
        }
      });

    return () => {
      subs1.unsubscribe();
      subs2.unsubscribe();
    };
  }, [multipleSelect, datasource]);

  const addArrows = (e: any) => {
    const node = e.target.closest("li");
    const parent = node.parentNode.closest("li");
    const isAncestorsCollapsed: boolean =
      node && parent
        ? parent.firstChild.classList.contains("hidden")
        : undefined;
    const isSiblingsCollapsed: boolean = Array.from<HTMLElement>(
      node.parentNode.children
    ).some(item => item.classList.contains("hidden"));

    setTopEdgeExpanded(!isAncestorsCollapsed);
    setRightEdgeExpanded(!isSiblingsCollapsed);
    setLeftEdgeExpanded(!isSiblingsCollapsed);
    setBottomEdgeExpanded(!isChildrenCollapsed);
  };

  const removeArrows = () => {
    setTopEdgeExpanded(undefined);
    setRightEdgeExpanded(undefined);
    setBottomEdgeExpanded(undefined);
    setLeftEdgeExpanded(undefined);
  };

  const toggleAncestors = (actionNode: HTMLElement) => {
    if (actionNode && actionNode.parentElement) {
      let node = actionNode.parentElement.closest("li");
      if (!node || !node.firstElementChild) return;
      const isAncestorsCollapsed = node.firstElementChild.classList.contains("hidden");
      if (isAncestorsCollapsed) {
        actionNode.classList.remove("isAncestorsCollapsed");
        node.firstElementChild.classList.remove("hidden");
      } else {
        const isSiblingsCollapsed = Array.from(
          actionNode.parentElement.children
        ).some(item => item.classList.contains("hidden"));
        if (!isSiblingsCollapsed) {
          toggleSiblings(actionNode);
        }
        actionNode.classList.add(
          ...(
            "isAncestorsCollapsed" +
            (isSiblingsCollapsed ? "" : " isSiblingsCollapsed")
          ).split(" ")
        );
        node.firstElementChild.classList.add("hidden");

        const parent = node.parentElement;

        if (parent) {
          const closest = parent.closest("li");
          if (closest) {
            const firstChild = closest.firstElementChild;
            if (firstChild) {
              if (!firstChild.classList.contains("hidden")) {
                toggleAncestors(node);
              }
            }
          }
        }
      }
    }
  };

  const topEdgeClickHandler = (e: any) => {
    e.stopPropagation();
    setTopEdgeExpanded(!topEdgeExpanded);
    toggleAncestors(e.target.closest("li"));
  };

  const bottomEdgeClickHandler = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    setIsChildrenCollapsed(!isChildrenCollapsed);
    setBottomEdgeExpanded(!bottomEdgeExpanded);
  };

  const toggleSiblings = (actionNode: HTMLElement) => {
    if (actionNode && actionNode.previousElementSibling && actionNode.parentElement) {
      let node = actionNode.previousElementSibling;
      const isSiblingsCollapsed = Array.from(
        actionNode.parentElement.children
      ).some(item => item.classList.contains("hidden"));
      actionNode.classList.toggle("isSiblingsCollapsed", !isSiblingsCollapsed);
      while (node) {
        if (isSiblingsCollapsed) {
          node.classList.remove("hidden");
        } else {
          node.classList.add("hidden");
        }
        node = node.previousElementSibling as Element;
      }
      node = actionNode.nextElementSibling as Element;
      while (node) {
        if (isSiblingsCollapsed) {
          node.classList.remove("hidden");
        } else {
          node.classList.add("hidden");
        }
        node = node.nextElementSibling as Element;
      }
      const parentElement = actionNode.parentElement;
      if (parentElement) {
        const closest = parentElement.closest("li");
        if (closest) {
          const firstElementChild = closest.firstElementChild;
          if (firstElementChild) {
            const isAncestorsCollapsed = firstElementChild.classList.contains("hidden");
            if (isAncestorsCollapsed) {
              toggleAncestors(actionNode);
            }
          }
        }
      }
    }
  };

  const hEdgeClickHandler = (e: any) => {
    e.stopPropagation();
    setLeftEdgeExpanded(!leftEdgeExpanded);
    setRightEdgeExpanded(!rightEdgeExpanded);
    toggleSiblings(e.target.closest("li"));
  };

  const filterAllowedDropNodes = (id: string, draggedNodeKind: NodeType) => {
    sendDragInfo(id, draggedNodeKind);
  };

  const clickNodeHandler = () => {
    if (onClickNode) {
      onClickNode({ key: dsKey, value: datasource });
    }

    sendSelectedNodeInfo(datasource.id);
  };

  const dragstartHandler = (event: React.DragEvent<HTMLDivElement>) => {
    const copyDS = { ...datasource };
    delete copyDS.relationship;
    copyDS.dsKey = dsKey;
    event.dataTransfer.setData("text/plain", JSON.stringify(copyDS));
    // highlight all potential drop targets
    if (node && node.current) {
      const draggedNodeKind: NodeType = node.current.getAttribute('data-kind') as NodeType;
      filterAllowedDropNodes(node.current.id, draggedNodeKind);
    }
  };

  const dragoverHandler = (event: React.DragEvent<HTMLDivElement>) => {
    // prevent default to allow drop
    event.preventDefault();
  };

  const dragendHandler = () => {
    // reset background of all potential drop targets
    clearDragInfo();
  };

  const dropHandler = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.classList.contains("allowedDrop")) {
      return;
    }
    clearDragInfo();
    const data: FundingLineOrCalculation = JSON.parse(event.dataTransfer.getData("text/plain"));
    const targetDsKey = data.dsKey;
    if (!targetDsKey) {
      return;
    }
    if (event.ctrlKey) {
      cloneNode && cloneNode(
        JSON.parse(event.dataTransfer.getData("text/plain")),
        targetDsKey,
        event.currentTarget.id,
        dsKey
      );
    }
    else {
      changeHierarchy && changeHierarchy(
        JSON.parse(event.dataTransfer.getData("text/plain")),
        targetDsKey,
        event.currentTarget.id,
        dsKey
      );
    }
  };

  return (
    <li className="oc-hierarchy">
      <div
        ref={node}
        id={datasource.id}
        data-kind={datasource.kind}
        className={nodeClass}
        draggable={draggable ? true : undefined}
        onDragStart={dragstartHandler}
        onDragOver={dragoverHandler}
        onDragEnd={dragendHandler}
        onDrop={dropHandler}
        onMouseEnter={addArrows}
        onMouseLeave={removeArrows}
      >
        <NodeTemplate
          nodeData={datasource}
          addNode={addNode}
          openSideBar={openSideBar}
          onClickNode={clickNodeHandler}
          editMode={editMode}
          dsKey={dsKey}
          nextId={nextId}
        />

        {collapsible &&
          datasource.relationship &&
          datasource.relationship.charAt(0) === "1" && (
            <i
              className={`oc-edge verticalEdge topEdge oci ${
                topEdgeExpanded === undefined
                  ? ""
                  : topEdgeExpanded
                    ? "oci-chevron-down"
                    : "oci-chevron-up"
                }`}
              onClick={topEdgeClickHandler}
            />
          )}
        {collapsible &&
          datasource.relationship &&
          datasource.relationship.charAt(1) === "1" && (
            <>
              <i
                className={`oc-edge horizontalEdge rightEdge oci ${
                  rightEdgeExpanded === undefined
                    ? ""
                    : rightEdgeExpanded
                      ? "oci-chevron-left"
                      : "oci-chevron-right"
                  }`}
                onClick={hEdgeClickHandler}
              />
              <i
                className={`oc-edge horizontalEdge leftEdge oci ${
                  leftEdgeExpanded === undefined
                    ? ""
                    : leftEdgeExpanded
                      ? "oci-chevron-right"
                      : "oci-chevron-left"
                  }`}
                onClick={hEdgeClickHandler}
              />
            </>
          )}
        {collapsible &&
          datasource.relationship &&
          datasource.relationship.charAt(2) === "1" && (
            <i
              className={`oc-edge verticalEdge bottomEdge oci ${
                bottomEdgeExpanded === undefined
                  ? ""
                  : bottomEdgeExpanded
                    ? "oci-chevron-up"
                    : "oci-chevron-down"
                }`}
              onClick={bottomEdgeClickHandler}
            />
          )}
      </div>
      {datasource.children && datasource.children.length > 0 && (
        <ul className={isChildrenCollapsed ? "hidden" : ""}>
          {datasource.children.map((node: FundingLineOrCalculation) => (
            <OrganisationChartNode
              datasource={node}
              NodeTemplate={NodeTemplate}
              id={node.id}
              key={node.id}
              draggable={draggable}
              collapsible={collapsible}
              multipleSelect={multipleSelect}
              changeHierarchy={changeHierarchy}
              cloneNode={cloneNode}
              onClickNode={onClickNode}
              addNode={addNode}
              openSideBar={openSideBar}
              editMode={editMode}
              nextId={nextId}
              dsKey={dsKey}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

OrganisationChartNode.defaultProps = defaultProps;

export default OrganisationChartNode;