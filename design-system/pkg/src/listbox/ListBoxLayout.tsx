import {
  InvalidationContext,
  LayoutInfo,
  Rect,
} from '@react-stately/virtualizer';
import {
  LayoutNode,
  ListLayout,
  ListLayoutOptions,
} from '@react-stately/layout';
import { Node } from '@react-types/shared';

export interface ListBoxLayoutOptions extends ListLayoutOptions {
  isLoading?: boolean;
  placeholderHeight?: number;
}

export class ListBoxLayout<T> extends ListLayout<T, ListBoxLayoutOptions> {
  private isLoading: boolean = false;
  private placeholderHeight: number | undefined;

  constructor(opts: ListBoxLayoutOptions) {
    super(opts);
    this.placeholderHeight = opts.placeholderHeight;
  }

  update(invalidationContext: InvalidationContext<ListBoxLayoutOptions>): void {
    this.isLoading = invalidationContext.layoutOptions?.isLoading || false;
    super.update(invalidationContext);
  }

  protected buildCollection(): LayoutNode[] {
    let nodes = super.buildCollection(this.padding);
    let y = this.contentSize.height;

    if (this.isLoading) {
      let rect = new Rect(0, y, this.virtualizer?.visibleRect.width, 40);
      let loader = new LayoutInfo('loader', 'loader', rect);
      let node = {
        layoutInfo: loader,
        validRect: loader.rect,
      };
      nodes.push(node);
      this.layoutNodes.set(loader.key, node);
      y = loader.rect.maxY;
    }

    if (nodes.length === 0) {
      let rect = new Rect(
        0,
        y,
        this.virtualizer?.visibleRect.width,
        this.placeholderHeight ?? this.virtualizer?.visibleRect.height
      );
      let placeholder = new LayoutInfo('placeholder', 'placeholder', rect);
      let node = {
        layoutInfo: placeholder,
        validRect: placeholder.rect,
      };
      nodes.push(node);
      this.layoutNodes.set(placeholder.key, node);
      y = placeholder.rect.maxY;
    }

    this.contentSize.height = y + this.padding;
    return nodes;
  }

  protected buildSection(node: Node<T>, x: number, y: number): LayoutNode {
    // Synthesize a collection node for the header.
    let headerNode = {
      type: 'header',
      key: node.key + ':header',
      parentKey: node.key,
      value: null,
      level: node.level,
      index: node.index,
      hasChildNodes: false,
      childNodes: [],
      rendered: node.rendered,
      textValue: node.textValue,
    };

    // Build layout node for it and adjust y offset of section children.
    let header = this.buildSectionHeader(headerNode, x, y);
    header.node = headerNode;
    header.layoutInfo.parentKey = node.key;
    this.layoutNodes.set(headerNode.key, header);
    y += header.layoutInfo.rect.height;

    let section = super.buildSection(node, x, y);
    section.children?.unshift(header);
    return section;
  }
}
