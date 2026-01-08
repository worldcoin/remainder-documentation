# What is a lookup argument?
A lookup argument demonstrates that a given multiset of values (the "witness") contains only values from a prescribed set (the "lookup table").

# Common applications of lookup arguments
Lookup arguments find various applications.
For example, in a "range check", the values of the witness are constrained to belong to a contiguous range of values.  This is useful when a purported digital decomposition in base $B$ is provided to the circuit as input, and it is therefore necessary, in particular, to check that the digits are indeed in the range $0 \dots B-1$.  The lookup table in this case is just this range.

Another example that occurs in the context of machine learning is checking the computation of an arbitrary function $f$ (e.g. a non-linearity like the sigmoid) in circuit.
Conceptually, in this application the lookup table consists of all valid input-output pairs $(x, f(x))$, and the witness consists of those pairs that are used.
Circuits work only with individual field elements, so a random linear combination of the input and output of each input-output pair is formed, i.e. $(x, y) \mapsto x + cy$ where $c$ is a challenge provided by the verifier.
When a lookup is used to encode a function in this way, it is referred to as an "indexed lookup" (whereas a range check is an example of an "unindexed lookup").

# Naive lookups and their limits
Certain lookups can be implemented in circuit in a direct and elementary fashion.  For example, to perform a range check for purported binary digits, it is sufficient to check that the polynomial $b(1-b)$ vanishes for all the digits.  This of course generalizes to higher bases.  However, this solution is inefficient for large (e.g. >16) bases.
In such cases, and also for typical applications of indexed lookups, a more sophisticated lookup argument is significantly more efficient.  To this end, Remainder implements the [LogUp](https://eprint.iacr.org/2023/1284) lookup argument of Papini and Haböck.

# LogUp
(We describe only the outline of LogUp.  If interested in further details, see [here](https://building-babylon.net/2024/02/14/a-royal-road-to-logup/).)

Let $w$ denote an MLE of witness values (with $M$ variables) and let $t$ denote the MLE of table values (with $N$ values).  For example, when performing a range check on purported base 256 digits, the entries of $w$ are the purported digits, while $t$ contains the values 0 .. 255 (and $N=8$).
LogUp additionally involves some auxilliary information in the form of the multiplicities $m$.  This MLE has the same length as the table $t$, and specifies the number of times that each table element occurs in the witness.
To continue the example, if $w = 233, 233, 0, 1$, then $m_0=1, m_1=1, m_{233} = 2$ with all other entries being zero.
The multiplicities $m$, like the table values $t$, are not computed in circuit, but rather provided as inputs.

LogUp demonstrates that the following equality holds in the field of fractions:
$$ \sum_{i=0}^{2^M - 1} \frac{1}{X - w_i} = \sum_{j=0}^{2^N - 1} \frac{m_j}{X - t_j}. $$
Under the assumption that the table values are distinct, this equality is equivalent to the statement: "the entries of $w$ contain only entries of $t$, and the value $t_j$ occurs in $w$ with multiplicity $m_j$".

This equality can be checked using a specialized GKR circuit that is implemented in Remainder.
In addition to $w, t, m$, this circuit also takes in a challenge provided by the verifier (that is substituted in place of the indeterminate).

# Important note on soundness
The implementation of LogUp in Remainder assumes that the field size is significantly larger than the table size and the witness size, and moreover that the witness length is less than the characteristic of the field.  These assumptions will always hold for practical tables and witness in the current implementation of Remainder, since it uses the scalar field of the BN254 curve.  It should be noted, however, that if Remainder were to be adapted to "small" fields (e.g. 32 bit fields) then soundness problems will arise for large tables and witnesses.