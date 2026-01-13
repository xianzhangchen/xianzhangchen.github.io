---
title: Add disorder by Kwant
date: 2024-05-23
source: https://zhoueit.github.io/2024/05/23/add-disorder-by-kwant/
---

# Add disorder by Kwant

Edit this post in:

- `blog/posts/add-disorder-by-kwant.md`

## Quick template

```python
import numpy as np

def onsite(site, W=0.5, rng=None):
    if rng is None:
        rng = np.random.default_rng(0)
    return W * (rng.random() - 0.5)
```

Add your full notes here.

