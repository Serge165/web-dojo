// =============================================================
// Oxygen Injection Module (TypeScript)
// Web Dojo — Fetches JSON and injects into data-inject slots
// Replaces the original lib-oxygen-injection-updated.ts that
// carried Bootstrap dependencies and Twitter context.
//
// This version is aligned with Web Dojo's block system:
//   - Uses data-inject attributes (matching oxygenBlocks.js)
//   - Works with the blocks.js / blocksExtra.js merge pattern
//   - Pure vanilla JS DOM — no Bootstrap bundle required
//
// Injection targets on oxygenBlocks.js sections:
//   data-inject="portfolio-timeline"  -> portfolio stem/leaf
//   data-inject="updates"             -> updates grid
//   data-inject="blog"                -> blog list + content
// =============================================================

export interface TimelineLeaf {
  id: string;
  title: string;
  date: string;
}

export interface TimelineStem {
  stem: string;
  leaves: TimelineLeaf[];
}

export interface UpdateItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  fullContent?: string;
}

export interface BlogPost {
  id: number | string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  author?: string;
  tags?: string[];
}

export interface InjectionPayload {
  timelines: TimelineStem[];
  updates: UpdateItem[];
  posts: BlogPost[];
}

// ---------------------------------------------------------------
// 1. Portfolio Timeline Injection
// ---------------------------------------------------------------
export function injectTimeline(
  container: HTMLElement | null,
  timelines: TimelineStem[]
): void {
  if (!container) {
    console.warn('[OxygenInjection] portfolio-timeline container not found');
    return;
  }

  const leafTemplate = document.createElement('div');
  leafTemplate.className = 'timeline-leaf';
  leafTemplate.innerHTML = `
    <div class="leaf-dot"></div>
    <div class="leaf-content"></div>
  `;

  container.innerHTML = '';

  timelines.forEach((entry) => {
    const stem = document.createElement('div');
    stem.className = 'timeline-stem';
    stem.textContent = entry.stem;
    container.appendChild(stem);

    const leavesContainer = document.createElement('div');
    leavesContainer.className = 'timeline-leaves';

    entry.leaves.forEach((leaf) => {
      const leafEl = leafTemplate.cloneNode(true) as HTMLElement;
      const content = leafEl.querySelector('.leaf-content') as HTMLElement;
      content.textContent = leaf.title;
      leafEl.setAttribute('data-leaf-id', leaf.id);
      leavesContainer.appendChild(leafEl);
    });

    container.appendChild(leavesContainer);
  });
}


// ---------------------------------------------------------------
// 2. Updates Grid Injection
// ---------------------------------------------------------------
export function injectUpdates(
  container: HTMLElement | null,
  updates: UpdateItem[]
): void {
  if (!container) {
    console.warn('[OxygenInjection] updates container not found');
    return;
  }

  const cardTemplate = document.createElement('div');
  cardTemplate.className = 'update-card';
  cardTemplate.innerHTML = `
    <div class="update-title"></div>
    <div class="update-excerpt"></div>
    <div class="update-date"></div>
    <div class="update-expand">→ Read more</div>
  `;

  container.innerHTML = '';

  updates.forEach((update) => {
    const card = cardTemplate.cloneNode(true) as HTMLElement;
    (card.querySelector('.update-title') as HTMLElement).textContent = update.title;
    (card.querySelector('.update-excerpt') as HTMLElement).textContent = update.excerpt;
    (card.querySelector('.update-date') as HTMLElement).textContent = update.date;
    card.setAttribute('data-update-id', update.id);

    const expand = card.querySelector('.update-expand') as HTMLElement;
    expand.addEventListener('click', () => {
      alert(update.fullContent || update.excerpt);
    });

    container.appendChild(card);
  });
}

// ---------------------------------------------------------------
// 3. Blog Injection (list + content)
// ---------------------------------------------------------------
export function injectBlog(
  container: HTMLElement | null,
  posts: BlogPost[]
): void {
  if (!container) {
    console.warn('[OxygenInjection] blog container not found');
    return;
  }

  const listEl = container.querySelector('#blogList') as HTMLElement;
  const contentEl = container.querySelector('#blogContent') as HTMLElement;

  if (!listEl || !contentEl) {
    console.warn('[OxygenInjection] blog list/content slots not found');
    return;
  }

  listEl.innerHTML = '';

  posts.forEach((post) => {
    const item = document.createElement('div');
    item.className = 'blog-item';
    item.setAttribute('data-blog-id', String(post.id));
    item.innerHTML = `
      <h4>${post.title}</h4>
      <div class="blog-item-date">${post.date}</div>
    `;

    item.addEventListener('click', () => {
      listEl.querySelectorAll('.blog-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      contentEl.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.excerpt || post.content}</p>
      `;
    });

    listEl.appendChild(item);
  });

  // Auto-select first post
  if (posts.length > 0) {
    const firstItem = listEl.querySelector('.blog-item') as HTMLElement;
    if (firstItem) {
      firstItem.classList.add('active');
      contentEl.innerHTML = `
        <h2>${posts[0].title}</h2>
        <p>${posts[0].excerpt || posts[0].content}</p>
      `;
    }
  }
}

// ---------------------------------------------------------------
// Master Injection Function
// ---------------------------------------------------------------
export async function injectOxygenContent(payload: InjectionPayload): Promise<void> {
  // Portfolio Timeline
  const portfolioNode = document.querySelector('[data-inject="portfolio-timeline"]') as HTMLElement;
  injectTimeline(portfolioNode, payload.timelines);

  // Updates
  const updatesNode = document.querySelector('[data-inject="updates"]') as HTMLElement;
  injectUpdates(updatesNode, payload.updates);

  // Blog
  const blogNode = document.querySelector('[data-inject="blog"]') as HTMLElement;
  injectBlog(blogNode, payload.posts);
}
