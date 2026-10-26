---
title: Reproducible on-site disorder in Kwant
date: 2024-05-23
status: published
language: en
source: https://zhoueit.github.io/2024/05/23/add-disorder-by-kwant/
---

On-site disorder should assign one fixed random value to each lattice site for a given sample. Kwant can evaluate an on-site function more than once, so drawing from a mutable random-number generator inside that function can change the Hamiltonian between evaluations. Recreating a generator with the same seed on every call has the opposite problem: every site receives the same first random number.

`kwant.digest.uniform` provides a convenient alternative. It maps a site identifier and a salt to a reproducible value in the interval $[0,1)$. For a disorder strength $W$, define

$$
V_i = W\left[u(k_i,s)-\frac{1}{2}\right].
$$

Here $k_i$ identifies a site, and $s$ identifies a disorder realization. The resulting on-site potential is distributed over $[-W/2,W/2)$.

## A complete finite-system example

```python
import kwant
import kwant.digest


def onsite(site, disorder_strength, salt):
    # Include the family so distinct sublattices do not share the same key.
    key = repr((site.family.name, tuple(int(value) for value in site.tag)))
    random_value = kwant.digest.uniform(key, salt=salt)
    return disorder_strength * (random_value - 0.5)


lat = kwant.lattice.square(norbs=1, name="sample")
system = kwant.Builder()
system[(lat(x, y) for x in range(20) for y in range(10))] = onsite
system[lat.neighbors()] = -1.0
finalized = system.finalized()

parameters = {"disorder_strength": 0.5, "salt": "sample-0"}
hamiltonian = finalized.hamiltonian_submatrix(params=parameters, sparse=True)
```

The hopping sets the energy unit in this example. If the clean model has a nonzero on-site term, add the disorder potential to that term. For a model with several orbitals per site, multiply a scalar disorder potential by the orbital identity matrix before adding it to the clean on-site matrix.

## Control the realization explicitly

- Keep the same lattice-family names, site tags and salt to reproduce a sample, regardless of the order in which Kwant evaluates the sites.
- Change the salt, for example from `"sample-0"` to `"sample-1"`, to obtain another realization. Record the salt with the physical parameters and the software versions used for a calculation.
- Keep the salt fixed while varying `disorder_strength` to rescale the same spatial pattern. This helps distinguish a change in strength from a change in sample.
- If clean leads are required, assign their on-site terms separately instead of applying the disordered function to the leads.

The family name is part of the key. Assign distinct explicit names to different sublattices when constructing a multi-sublattice model. Renaming a family changes the disorder realization even if its coordinates are unchanged.

## References

- [Kwant documentation: reproducible randomness with `kwant.digest`](https://kwant-project.org/doc/1/reference/kwant.digest)
- [Original note](https://zhoueit.github.io/2024/05/23/add-disorder-by-kwant/)
