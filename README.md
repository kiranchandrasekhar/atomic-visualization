# Atoms #
Atom simulization and visualization

# Authors #
Shashank Iswara and Kiran Chandrasekhar

## Running the program ##
All the necessary files to run the program can be found in the "dist" directory.

One way to run the web app locally would be to set up a local http server at dist.
The following command will accomplish this: 

`http-server dist -c-1`

To recompile the project after making changes to the src, one may run the python 
make script like so:

`python3 make-atoms.py`

## How to use / Controls ##
Loading the web app will display a single atom visualization: the hydrogen atom 
in the ground state. One can use the following keys to move around the visualization 
and view the atom from different angles:

| Key | Functionality |
| --- | --- |
| W | Move forward |
| A | Move left |
| S | Move backwards |
| D | Move right |
| K | Move up |
| M | Move down |
| Mouse | Move camera/look around |
| R | Reset camera |

There will also be a GUI on the upper-right corner. By moving the sliders for N, L, and M,
one may change the quantum numbers of the orbitals to display (thereby changing the display). 
When L and M are both nonzero, the electron clouds will begin orbiting. 

Due to how the quantum numbers work, the constraints on M are dependent on L, and L on N. 
Therefore, modifying one of the "parent" sliders in the following N-L-M hierarchy will reset the "children" 
to 0, to avoid displaying invalid quantum numbers.

The next section of the GUI allows one to vary the atomic number of the atom. Clicking the "Update" button below 
will refresh the page to show the atom for the respective element. Note that the values and sliders for N, L, and M 
will be nonfunctional for any atomic number that isn't 1 (aka hydrogen), as the values are automatically set. Updating the atomic number back to 1 will make N, L, and M manually controllable again.

Finally, there are two toggles available. Clicking either will enable/disable the respective feature. 

Enabling the cutaway feature will remove one quadrant from rendering, allowing one to look into the internal electron clouds. 

Enabling the shading feature will add shadows and lighting. While this is not physically accurate, as this program is in the subatomic level, this may allow for clearer depth when zoomed-in.




